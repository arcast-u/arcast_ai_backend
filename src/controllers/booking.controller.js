import { VAT_RATE, CLEARING_TIME_MINUTES, MAX_BOOKING_HOURS } from '../config/constants.config.js';
import prisma from '../config/db.config.js';
import { calculateBaseCost, calculateTotalCostWithDiscount, validateBookingTime } from '../utils/booking.utils.js';
import { ValidationError } from '../errors/custom.errors.js';
import { calculateDiscountAmount, validateDiscountCode } from '../utils/discount.utils.js';
import { createNotionBookingEntry } from '../utils/notion.utils.js';
import { sendWebhookNotification } from '../utils/webhook.utils.js';
import { WEBHOOK_CONFIG } from '../config/webhook.config.js';

export class BookingController {
  createBooking = async (req, res) => {
    const {
      studioId,
      packageId,
      numberOfSeats,
      startTime,
      duration,
      discountCode,
      lead
    } = req.body;

    try {
      // Start a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Validate studio availability
        const studio = await tx.studio.findUnique({
          where: { id: studioId },
          include: { bookings: true }
        });

        if (!studio) {
          throw new ValidationError('Studio not found');
        }

        if (numberOfSeats > studio.totalSeats) {
          throw new ValidationError('Requested seats exceed studio capacity');
        }

        // 2. Validate and calculate booking time
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

        // console.log('Booking time validation:', {
        //   studioId,
        //   startTime: startDateTime.toISOString(),
        //   endTime: endDateTime.toISOString(),
        //   openingTime: studio.openingTime,
        //   closingTime: studio.closingTime,
        //   existingBookings: studio.bookings.map(b => ({
        //     start: b.startTime.toISOString(),
        //     end: b.endTime.toISOString()
        //   }))
        // });
        const isTimeValid = await validateBookingTime(
          tx,
          studioId,
          startDateTime,
          endDateTime,
          studio.openingTime,
          studio.closingTime
        );

        if (!isTimeValid) {
          throw new ValidationError('Selected time slot is not available');
        }

        // 3. Get package details
        const studioPackage = await tx.studioPackage.findUnique({
          where: { id: packageId }
        });

        if (!studioPackage) {
          throw new Error('Package not found');
        }

        // 4. Validate discount code if provided
        let validatedDiscount = null;
        if (discountCode) {
          validatedDiscount = await tx.discountCode.findUnique({
            where: { code: discountCode }
          });
          
          if (!validatedDiscount || !validatedDiscount.isActive || validatedDiscount.endDate < new Date()) {
            throw new ValidationError('Invalid or expired discount code');
          }
        }

        // 5. Calculate costs
        const baseCost = calculateBaseCost(studioPackage.price_per_hour, duration);
        const discountAmount = validatedDiscount 
          ? validatedDiscount.type === 'PERCENTAGE'
            ? (baseCost * validatedDiscount.value) / 100
            : validatedDiscount.value
          : 0;
        const costAfterDiscount = baseCost - discountAmount;
        const vatAmount = (costAfterDiscount * VAT_RATE) / 100;
        const totalCost = costAfterDiscount + vatAmount;

        // 6. Create or get lead
        let bookingLead;
        if (lead.email) {
          // If email is provided, try to find existing lead
          const existingLead = await tx.lead.findFirst({
            where: { email: lead.email }
          });

          bookingLead = existingLead 
            ? await tx.lead.update({
                where: { id: existingLead.id },
                data: {
                  fullName: lead.fullName,
                  phoneNumber: lead.phoneNumber,
                  ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
                  ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
                }
              })
            : await tx.lead.create({
                data: {
                  fullName: lead.fullName,
                  email: lead.email,
                  phoneNumber: lead.phoneNumber,
                  ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
                  ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
                }
              });
        } else {
          // If no email, create new lead without email
          bookingLead = await tx.lead.create({
            data: {
              fullName: lead.fullName,
              phoneNumber: lead.phoneNumber,
              ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
              ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
            }
          });
        }

        // 7. Create booking
        const booking = await tx.booking.create({
          data: {
            startTime: startDateTime,
            endTime: endDateTime,
            numberOfSeats,
            totalCost,
            vatAmount,
            discountAmount,
            discountCodeId: validatedDiscount?.id,
            status: 'PENDING',
            studioId,
            packageId,
            leadId: bookingLead.id
          },
          include: {
            studio: true,
            package: true,
            lead: true,
            discountCode: true
          }
        });

        // 8. Update discount usage if applicable
        if (validatedDiscount) {
          await tx.discountCode.update({
            where: { id: validatedDiscount.id },
            data: { usedCount: { increment: 1 } }
          });
        }

        return booking;
      });

      // Create Notion entry after successful booking
      try {
        const notionEntryId = await createNotionBookingEntry(result);
        
        // Send webhook notification
        if (WEBHOOK_CONFIG.TRIGGER_DEV.ENABLED) {
          try {
            const webhookResponse = await sendWebhookNotification(
              WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_URL,
              WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_TOKEN,
              result
            );
            console.log('Webhook notification sent successfully:', webhookResponse);
          } catch (webhookError) {
            console.error('Failed to send webhook notification:', webhookError);
            // Don't fail the request if webhook fails
          }
        }
        
        res.status(201).json({
          ...result
        });
      } catch (notionError) {
        console.error('Failed to create Notion entry:', notionError);
        
        // Still try to send webhook notification even if Notion fails
        if (WEBHOOK_CONFIG.TRIGGER_DEV.ENABLED) {
          try {
            const webhookResponse = await sendWebhookNotification(
              WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_URL,
              WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_TOKEN,
              result
            );
            console.log('Webhook notification sent successfully:', webhookResponse);
          } catch (webhookError) {
            console.error('Failed to send webhook notification:', webhookError);
            // Don't fail the request if webhook fails
          }
        }
        
        // Still return success since booking was created
        res.status(201).json({
          ...result,
          notionError: 'Failed to create CRM entry'
        });
      }
    } catch (error) {
      console.error('Booking creation error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      // Handle all validation errors, including custom ones
      if (error instanceof ValidationError || error.message.includes('not available') || 
          error.message.includes('not found') || error.message.includes('exceed')) {
        return res.status(400).json({ 
          error: 'Validation Error',
          message: error.message 
        });
      }

      // Handle unexpected errors
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      });
    }
  }

  validateDiscountCode = async (req, res) => {
    const { code } = req.query;
    try {
      const discount = await prisma.discountCode.findUnique({
        where: { code }
      });

      if (!discount || !discount.isActive || discount.endDate < new Date()) {
        return res.json({ 
          valid: false,
          message: 'Invalid or expired discount code'
        });
      }

      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return res.json({
          valid: false,
          message: 'Discount code has reached its usage limit'
        });
      }

      res.json({
        valid: true,
        type: discount.type,
        value: discount.value,
        minAmount: discount.minAmount
      });
    } catch (error) {
      console.error('Error validating discount code:', error);
      res.status(500).json({ 
        error: 'Failed to validate discount code',
        details: error.message 
      });
    }
  }

  /**
   * Apply a discount code to a booking
   */
  applyDiscountCode = async (req, res, next) => {
    try {
      const { bookingId, discountCode: code } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { discountCode: true }
      });

      if (!booking) {
        throw new ValidationError('Booking not found');
      }

      if (booking.discountCode) {
        throw new ValidationError('A discount code has already been applied to this booking');
      }

      const discountCode = await prisma.discountCode.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!discountCode) {
        throw new ValidationError('Invalid discount code');
      }

      // Validate the discount code
      validateDiscountCode(discountCode, booking.totalAmount);

      // Calculate discount amount
      const discountAmount = calculateDiscountAmount(discountCode, booking.totalAmount);

      // Update the booking with the discount
      const updatedBooking = await prisma.$transaction(async (prisma) => {
        // Increment the used count
        await prisma.discountCode.update({
          where: { id: discountCode.id },
          data: { usedCount: { increment: 1 } }
        });

        // Apply the discount to the booking
        return prisma.booking.update({
          where: { id: bookingId },
          data: {
            discountCodeId: discountCode.id,
            discountAmount: discountAmount,
            totalAmount: booking.totalAmount - discountAmount
          }
        });
      });

      res.json({
        success: true,
        data: updatedBooking
      });
    } catch (error) {
      next(error);
    }
  }

  getBookingDetails = async (req, res) => {
    const { id } = req.params;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          studio: {
            include: {
              packages: true
            }
          },
          package: {
            include: {
              packagePerks: true
            }
          },
          lead: true,
          discountCode: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found'
        });
      }

      // Format the response
      const response = {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        numberOfSeats: booking.numberOfSeats,
        status: booking.status,
        totalCost: booking.totalCost,
        vatAmount: booking.vatAmount,
        discountAmount: booking.discountAmount,
        studio: {
          id: booking.studio.id,
          name: booking.studio.name,
          location: booking.studio.location,
          totalSeats: booking.studio.totalSeats
        },
        package: {
          id: booking.package.id,
          name: booking.package.name,
          description: booking.package.description,
          pricePerHour: booking.package.pricePerHour,
          perks: booking.package.packagePerks.map(perk => ({
            name: perk.name,
            description: perk.description
          }))
        },
        lead: {
          fullName: booking.lead.fullName,
          email: booking.lead.email,
          phoneNumber: booking.lead.phoneNumber,
          whatsappNumber: booking.lead.whatsappNumber,
          recordingLocation: booking.lead.recordingLocation
        },
        discount: booking.discountCode ? {
          code: booking.discountCode.code,
          percentageOff: booking.discountCode.percentageOff,
          amount: booking.discountAmount
        } : null
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      res.status(500).json({
        error: 'Failed to fetch booking details',
        details: error.message
      });
    }
  }
}