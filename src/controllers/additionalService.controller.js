import prisma from '../config/db.config.js';
import { ValidationError } from '../errors/custom.errors.js';

export class AdditionalServiceController {
  /**
   * Create a new additional service
   */
  createAdditionalService = async (req, res, next) => {
    try {
      const {
        title,
        type,
        price,
        currency,
        count,
        description,
        imageUrls,
        videoUrl,
        isActive
      } = req.body;

      const additionalService = await prisma.additionalService.create({
        data: {
          title,
          type,
          price,
          currency: currency || 'AED',
          count: count || 1,
          description,
          imageUrls: imageUrls || [],
          videoUrl,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      res.status(201).json({
        success: true,
        data: additionalService
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all additional services
   */
  getAllAdditionalServices = async (req, res, next) => {
    try {
      const { active } = req.query;
      
      const where = {};
      if (active !== undefined) {
        where.isActive = active === 'true';
      }

      const additionalServices = await prisma.additionalService.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: additionalServices
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get additional service by ID
   */
  getAdditionalServiceById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const additionalService = await prisma.additionalService.findUnique({
        where: { id }
      });

      if (!additionalService) {
        throw new ValidationError('Additional service not found');
      }

      res.json({
        success: true,
        data: additionalService
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an additional service
   */
  updateAdditionalService = async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        title,
        type,
        price,
        currency,
        count,
        description,
        imageUrls,
        videoUrl,
        isActive
      } = req.body;

      // Check if the additional service exists
      const existingService = await prisma.additionalService.findUnique({
        where: { id }
      });

      if (!existingService) {
        throw new ValidationError('Additional service not found');
      }

      // Update the additional service
      const updatedService = await prisma.additionalService.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(type !== undefined && { type }),
          ...(price !== undefined && { price }),
          ...(currency !== undefined && { currency }),
          ...(count !== undefined && { count }),
          ...(description !== undefined && { description }),
          ...(imageUrls !== undefined && { imageUrls }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({
        success: true,
        data: updatedService
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an additional service
   */
  deleteAdditionalService = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if the additional service exists
      const existingService = await prisma.additionalService.findUnique({
        where: { id }
      });

      if (!existingService) {
        throw new ValidationError('Additional service not found');
      }

      // Check if the additional service is used in any bookings
      const bookingServices = await prisma.bookingAdditionalService.findFirst({
        where: { additionalServiceId: id }
      });

      if (bookingServices) {
        // Instead of deleting, just mark as inactive
        await prisma.additionalService.update({
          where: { id },
          data: { isActive: false }
        });

        return res.json({
          success: true,
          message: 'Additional service is in use and has been marked as inactive'
        });
      }

      // Delete the additional service
      await prisma.additionalService.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Additional service deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add additional service to a booking
   */
  addServiceToBooking = async (req, res, next) => {
    try {
      const { bookingId, additionalServiceId, quantity } = req.body;

      // Check if the booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new ValidationError('Booking not found');
      }

      // Check if the additional service exists
      const additionalService = await prisma.additionalService.findUnique({
        where: { id: additionalServiceId }
      });

      if (!additionalService) {
        throw new ValidationError('Additional service not found');
      }

      // Check if the service is already added to the booking
      const existingBookingService = await prisma.bookingAdditionalService.findUnique({
        where: {
          bookingId_additionalServiceId: {
            bookingId,
            additionalServiceId
          }
        }
      });

      if (existingBookingService) {
        // Update the quantity and price
        const updatedBookingService = await prisma.bookingAdditionalService.update({
          where: {
            bookingId_additionalServiceId: {
              bookingId,
              additionalServiceId
            }
          },
          data: {
            quantity: quantity || 1,
            price: additionalService.price
          }
        });

        // Recalculate the total cost of the booking
        await this.recalculateBookingCost(bookingId);

        return res.json({
          success: true,
          data: updatedBookingService,
          message: 'Additional service quantity updated in booking'
        });
      }

      // Add the additional service to the booking
      const bookingService = await prisma.bookingAdditionalService.create({
        data: {
          bookingId,
          additionalServiceId,
          quantity: quantity || 1,
          price: additionalService.price
        }
      });

      // Recalculate the total cost of the booking
      await this.recalculateBookingCost(bookingId);

      res.status(201).json({
        success: true,
        data: bookingService,
        message: 'Additional service added to booking successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove additional service from a booking
   */
  removeServiceFromBooking = async (req, res, next) => {
    try {
      const { bookingId, additionalServiceId } = req.params;

      // Check if the booking service exists
      const bookingService = await prisma.bookingAdditionalService.findUnique({
        where: {
          bookingId_additionalServiceId: {
            bookingId,
            additionalServiceId
          }
        }
      });

      if (!bookingService) {
        throw new ValidationError('Additional service not found in this booking');
      }

      // Remove the additional service from the booking
      await prisma.bookingAdditionalService.delete({
        where: {
          bookingId_additionalServiceId: {
            bookingId,
            additionalServiceId
          }
        }
      });

      // Recalculate the total cost of the booking
      await this.recalculateBookingCost(bookingId);

      res.json({
        success: true,
        message: 'Additional service removed from booking successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all additional services for a booking
   */
  getBookingAdditionalServices = async (req, res, next) => {
    try {
      const { bookingId } = req.params;

      // Check if the booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new ValidationError('Booking not found');
      }

      // Get all additional services for the booking
      const bookingServices = await prisma.bookingAdditionalService.findMany({
        where: { bookingId },
        include: {
          additionalService: true
        }
      });

      res.json({
        success: true,
        data: bookingServices
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Recalculate the total cost of a booking
   * This is a helper method used internally
   */
  recalculateBookingCost = async (bookingId) => {
    // Get the booking with package and additional services
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        package: true,
        additionalServices: {
          include: {
            additionalService: true
          }
        }
      }
    });

    if (!booking) {
      throw new ValidationError('Booking not found');
    }

    // Calculate the duration in hours
    const durationInHours = (booking.endTime - booking.startTime) / (1000 * 60 * 60);
    
    // Calculate the base cost from the package
    const packageCost = parseFloat(booking.package.price_per_hour) * durationInHours;
    
    // Calculate the cost of additional services
    const additionalServicesCost = booking.additionalServices.reduce((total, service) => {
      return total + (parseFloat(service.price) * service.quantity);
    }, 0);
    
    // Calculate the total cost before discount
    const totalBeforeDiscount = packageCost + additionalServicesCost;
    
    // Apply discount if any
    const discountAmount = booking.discountAmount ? parseFloat(booking.discountAmount) : 0;
    
    // Calculate the cost after discount
    const costAfterDiscount = totalBeforeDiscount - discountAmount;
    
    // Calculate VAT (assuming VAT_RATE is defined elsewhere)
    // For now, we'll recalculate based on the existing VAT percentage
    const vatPercentage = (parseFloat(booking.vatAmount) / (parseFloat(booking.totalCost) - parseFloat(booking.vatAmount))) * 100;
    const vatAmount = (costAfterDiscount * vatPercentage) / 100;
    
    // Calculate the final total cost
    const totalCost = costAfterDiscount + vatAmount;
    
    // Update the booking with the new costs
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalCost,
        vatAmount
      }
    });
    
    return { totalCost, vatAmount, discountAmount };
  };
} 