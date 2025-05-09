import { DiscountCodeError } from '../errors/custom.errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate the discount amount based on the discount type and booking amount
 * @param {Object} discountCode - The discount code object
 * @param {number} bookingAmount - The original booking amount
 * @returns {number} The calculated discount amount
 */
export const calculateDiscountAmount = (discountCode, bookingAmount) => {
  if (discountCode.type === 'PERCENTAGE') {
    return (bookingAmount * discountCode.value) / 100;
  }
  return Math.min(discountCode.value, bookingAmount); // For fixed amount, don't exceed booking amount
};

/**
 * Validate a discount code for use
 * @param {Object} discountCode - The discount code object
 * @param {number} bookingAmount - The original booking amount
 * @param {string} email - The email of the client making the booking
 * @throws {DiscountCodeError} If the discount code is invalid
 */
export const validateDiscountCode = async (discountCode, bookingAmount, email = null) => {
  const now = new Date();

  if (!discountCode.isActive) {
    throw new DiscountCodeError('This discount code is not active');
  }

  if (now < discountCode.startDate || now > discountCode.endDate) {
    throw new DiscountCodeError('This discount code has expired or is not yet valid');
  }

  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    throw new DiscountCodeError('This discount code has reached its maximum usage limit');
  }

  if (discountCode.minAmount && bookingAmount < discountCode.minAmount) {
    throw new DiscountCodeError(
      `This discount code requires a minimum booking amount of $${discountCode.minAmount}`
    );
  }

  // Check for first-time client restriction using email
  if (discountCode.firstTimeOnly && email) {
    // Instead of fetching all leads and bookings, just count if there are any bookings
    const bookingsCount = await prisma.booking.count({
      where: {
        lead: {
          email: email
        }
      }
    });
    
    if (bookingsCount > 0) {
      throw new DiscountCodeError(
        'You cannot use this discount code because you have made a booking before. This code is only valid for first-time clients.'
      );
    }
  }
}; 