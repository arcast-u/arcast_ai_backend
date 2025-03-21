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
      lead,
      additionalServices
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
          
          // Check for first-time customer restriction
          if (validatedDiscount.firstTimeOnly) {
            // Count previous bookings for this lead
            const previousBookings = await tx.booking.count({
              where: { leadId: lead.id }
            });
            
            if (previousBookings > 0) {
              throw new ValidationError('This discount code is only valid for first-time clients');
            }
          }
        }

        // 5. Calculate base costs
        const baseCost = calculateBaseCost(studioPackage.price_per_hour, duration);
        
        // 6. Calculate additional services cost
        let additionalServicesCost = 0;
        let additionalServicesData = [];
        
        if (additionalServices && additionalServices.length > 0) {
          // Fetch all additional services in one query
          const serviceIds = additionalServices.map(service => service.id);
          const availableServices = await tx.additionalService.findMany({
            where: {
              id: { in: serviceIds },
              isActive: true
            }
          });
          
          // Create a map for quick lookup
          const serviceMap = new Map();
          availableServices.forEach(service => {
            serviceMap.set(service.id, service);
          });
          
          // Validate and calculate costs for each service
          for (const service of additionalServices) {
            const additionalService = serviceMap.get(service.id);
            
            if (!additionalService) {
              throw new ValidationError(`Additional service with ID ${service.id} not found or inactive`);
            }
            
            const quantity = service.quantity || 1;
            const serviceCost = parseFloat(additionalService.price) * quantity;
            additionalServicesCost += serviceCost;
            
            additionalServicesData.push({
              additionalServiceId: additionalService.id,
              quantity,
              price: additionalService.price
            });
          }
        }
        
        // 7. Calculate total costs with additional services
        const totalBeforeDiscount = baseCost + additionalServicesCost;
        const discountAmount = validatedDiscount 
          ? validatedDiscount.type === 'PERCENTAGE'
            ? (totalBeforeDiscount * validatedDiscount.value) / 100
            : validatedDiscount.value
          : 0;
        const costAfterDiscount = totalBeforeDiscount - discountAmount;
        const vatAmount = (costAfterDiscount * VAT_RATE) / 100;
        const totalCost = costAfterDiscount + vatAmount;

        // 8. Create or get lead
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

        // 9. Create booking
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
            leadId: bookingLead.id,
            additionalServices: {
              create: additionalServicesData
            }
          },
          include: {
            studio: true,
            package: true,
            lead: true,
            discountCode: true,
            additionalServices: {
              include: {
                additionalService: true
              }
            }
          }
        });

        // 10. Update discount usage if applicable
        if (validatedDiscount) {
          await tx.discountCode.update({
            where: { id: validatedDiscount.id },
            data: { usedCount: { increment: 1 } }
          });
        }

        return booking;
      });

      // Format the response
      const formattedAdditionalServices = result.additionalServices.map(service => ({
        id: service.id,
        quantity: service.quantity,
        price: service.price,
        service: {
          id: service.additionalService.id,
          title: service.additionalService.title,
          type: service.additionalService.type,
          description: service.additionalService.description
        }
      }));

      const response = {
        id: result.id,
        startTime: result.startTime,
        endTime: result.endTime,
        totalCost: result.totalCost,
        vatAmount: result.vatAmount,
        discountAmount: result.discountAmount,
        studio: {
          id: result.studio.id,
          name: result.studio.name
        },
        package: {
          id: result.package.id,
          name: result.package.name
        },
        lead: {
          id: result.lead.id,
          fullName: result.lead.fullName,
          email: result.lead.email,
          phoneNumber: result.lead.phoneNumber
        },
        additionalServices: formattedAdditionalServices
      };

      // Send webhook notification
      try {
        await sendWebhookNotification(WEBHOOK_CONFIG.BOOKING_CREATED, {
          bookingId: result.id,
          studioName: result.studio.name,
          packageName: result.package.name,
          customerName: result.lead.fullName,
          startTime: result.startTime,
          endTime: result.endTime,
          totalCost: result.totalCost
        });
      } catch (webhookError) {
        console.error('Failed to send webhook notification:', webhookError);
      }

      // Create Notion entry
      try {
        await createNotionBookingEntry(result);
      } catch (notionError) {
        console.error('Failed to create Notion entry:', notionError);
      }

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating booking:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message
        });
      }
      
      res.status(500).json({
        error: 'Failed to create booking',
        details: error.message
      });
    }
  }

  validateDiscountCode = async (req, res) => {
    const { code, amount, leadId } = req.query;
    try {
      const discount = await prisma.discountCode.findUnique({
        where: { code }
      });

      if (!discount || !discount.isActive || discount.endDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired discount code'
        });
      }

      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return res.status(400).json({
          success: false,
          message: 'Discount code has reached its usage limit'
        });
      }

      // Check for first-time client restriction if leadId is provided
      if (discount.firstTimeOnly && leadId) {
        const previousBookings = await prisma.booking.count({
          where: { leadId }
        });
        
        if (previousBookings > 0) {
          return res.status(400).json({
            success: false,
            message: 'This discount code is only valid for first-time clients'
          });
        }
      }

      res.status(200).json({
        success: true,
        valid: true,
        type: discount.type,
        value: discount.value,
        minAmount: discount.minAmount,
        firstTimeOnly: discount.firstTimeOnly
      });
    } catch (error) {
      console.error('Error validating discount code:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate discount code',
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

      // Validate the discount code (including first-time client check)
      await validateDiscountCode(discountCode, booking.totalCost, booking.lead.id);

      // Calculate discount amount
      const discountAmount = calculateDiscountAmount(discountCode, booking.totalCost);

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
            totalCost: booking.totalCost - discountAmount
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
          discountCode: true,
          additionalServices: {
            include: {
              additionalService: true
            }
          }
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
        } : null,
        additionalServices: booking.additionalServices.map(service => ({
          id: service.id,
          quantity: service.quantity,
          price: service.price,
          service: {
            id: service.additionalService.id,
            title: service.additionalService.title,
            type: service.additionalService.type,
            description: service.additionalService.description,
            imageUrls: service.additionalService.imageUrls,
            videoUrl: service.additionalService.videoUrl
          }
        }))
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