import { VAT_RATE, CLEARING_TIME_MINUTES, MAX_BOOKING_HOURS } from '../config/constants.config.js';
import prisma from '../config/db.config.js';
import { calculateBaseCost, calculateTotalCostWithDiscount, validateBookingTime } from '../utils/booking.utils.js';
import { ValidationError } from '../errors/custom.errors.js';
import { calculateDiscountAmount, validateDiscountCode } from '../utils/discount.utils.js';
import { createNotionBookingEntry } from '../utils/notion.utils.js';

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
      // 1. Pre-transaction validations - moving these outside the transaction
      
      // Validate studio exists and has capacity
      const studio = await prisma.studio.findUnique({
        where: { id: studioId },
        select: {
          id: true,
          totalSeats: true,
          openingTime: true,
          closingTime: true,
          name: true
        }
      });

      if (!studio) {
        throw new ValidationError('Studio not found');
      }

      if (numberOfSeats > studio.totalSeats) {
        throw new ValidationError('Requested seats exceed studio capacity');
      }

      // Calculate booking times
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

      // Validate time slot availability - only load bookings that might conflict
      const isTimeValid = await validateBookingTime(
        prisma,
        studioId,
        startDateTime,
        endDateTime,
        studio.openingTime,
        studio.closingTime
      );

      if (!isTimeValid) {
        throw new ValidationError('Selected time slot is not available');
      }

      // Get package details with minimal data
      const studioPackage = await prisma.studioPackage.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          name: true,
          price_per_hour: true
        }
      });

      if (!studioPackage) {
        throw new ValidationError('Package not found');
      }
      
      // Pre-validate discount code
      let validatedDiscount = null;
      if (discountCode) {
        validatedDiscount = await prisma.discountCode.findUnique({
          where: { code: discountCode }
        });
        
        if (!validatedDiscount || !validatedDiscount.isActive || validatedDiscount.endDate < new Date()) {
          throw new ValidationError('Invalid or expired discount code');
        }
        
        // First-time customer check
        if (validatedDiscount.firstTimeOnly && lead.email) {
          const bookingsCount = await prisma.booking.count({
            where: {
              lead: {
                email: lead.email
              }
            }
          });
          
          if (bookingsCount > 0) {
            throw new ValidationError('This discount code is only valid for first-time clients');
          }
        }
      }

      // Pre-fetch additional services to validate
      let additionalServicesData = [];
      let additionalServicesCost = 0;
      
      if (additionalServices && additionalServices.length > 0) {
        const serviceIds = additionalServices.map(service => service.id);
        const availableServices = await prisma.additionalService.findMany({
          where: {
            id: { in: serviceIds },
            isActive: true
          }
        });
        
        const serviceMap = new Map();
        availableServices.forEach(service => {
          serviceMap.set(service.id, service);
        });
        
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
      
      // Calculate costs
      const baseCost = calculateBaseCost(studioPackage.price_per_hour, duration);
      const totalBeforeDiscount = baseCost + additionalServicesCost;
      const discountAmount = validatedDiscount 
        ? validatedDiscount.type === 'PERCENTAGE'
          ? (totalBeforeDiscount * validatedDiscount.value) / 100
          : validatedDiscount.value
        : 0;
      const costAfterDiscount = totalBeforeDiscount - discountAmount;
      const vatAmount = (costAfterDiscount * VAT_RATE) / 100;
      const totalCost = costAfterDiscount + vatAmount;

      // 2. Now start a shorter transaction that only does essential writes
      const result = await prisma.$transaction(async (tx) => {
        // Handle lead creation/update
        let bookingLead;
        if (lead.email) {
          const existingLead = await tx.lead.findFirst({
            where: { email: lead.email }
          });

          bookingLead = existingLead 
            ? await tx.lead.update({
                where: { id: existingLead.id },
                data: {
                  fullName: lead.fullName,
                  ...(lead.phoneNumber && { phoneNumber: lead.phoneNumber }),
                  ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
                  ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
                }
              })
            : await tx.lead.create({
                data: {
                  fullName: lead.fullName,
                  email: lead.email,
                  ...(lead.phoneNumber && { phoneNumber: lead.phoneNumber }),
                  ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
                  ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
                }
              });
        } else {
          bookingLead = await tx.lead.create({
            data: {
              fullName: lead.fullName,
              ...(lead.phoneNumber && { phoneNumber: lead.phoneNumber }),
              ...(lead.recordingLocation && { recordingLocation: lead.recordingLocation }),
              ...(lead.whatsappNumber && { whatsappNumber: lead.whatsappNumber })
            }
          });
        }

        // Create booking
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

        // Update discount usage if applicable
        if (validatedDiscount) {
          await tx.discountCode.update({
            where: { id: validatedDiscount.id },
            data: { usedCount: { increment: 1 } }
          });
        }

        return booking;
      }, {
        timeout: 15000 // Still use a higher timeout as a safety net
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
    try {
      const { code, amount, email } = req.query;
      
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

      // Check for first-time client restriction if email is provided
      if (discount.firstTimeOnly && email) {
        const bookingsCount = await prisma.booking.count({
          where: {
            lead: {
              email: email
            }
          }
        });
        
        if (bookingsCount > 0) {
          return res.status(400).json({
            success: false,
            message: 'This discount code is only valid for first-time clients'
          });
        }
      }
      
      return res.status(200).json({
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

      // Get booking details with lead info
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { 
          discountCode: true,
          lead: true
        }
      });
      
      if (!booking) {
        throw new ValidationError('Booking not found');
      }
      
      // Check if a discount code is already applied
      if (booking.discountCode) {
        throw new ValidationError('A discount code has already been applied to this booking');
      }
      
      const discountCode = await prisma.discountCode.findUnique({
        where: { code }
      });
      
      if (!discountCode) {
        throw new ValidationError('Invalid discount code');
      }
      
      // Validate the discount code using lead's email for first-time check
      if (booking.lead && booking.lead.email) {
        await validateDiscountCode(discountCode, booking.totalCost, booking.lead.email);
      } else {
        // If no email, just validate the basic aspects of the discount code
        await validateDiscountCode(discountCode, booking.totalCost);
      }
      
      // Calculate discount amount
      const discountAmount = calculateDiscountAmount(discountCode, booking.totalCost);
      
      // Update the discount code usage count
      await prisma.discountCode.update({
        where: { id: discountCode.id },
        data: { usedCount: discountCode.usedCount + 1 }
      });
      
      // Apply the discount to the booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          discountCodeId: discountCode.id,
          discountAmount: discountAmount,
          totalCost: booking.totalCost - discountAmount
        }
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