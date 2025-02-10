import { ValidationError } from '../errors/custom.errors.js';

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
 * @throws {ValidationError} If the discount code is invalid
 */
export const validateDiscountCode = (discountCode, bookingAmount) => {
  const now = new Date();

  if (!discountCode.isActive) {
    throw new ValidationError('This discount code is not active');
  }

  if (now < discountCode.startDate || now > discountCode.endDate) {
    throw new ValidationError('This discount code has expired or is not yet valid');
  }

  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    throw new ValidationError('This discount code has reached its usage limit');
  }

  if (discountCode.minAmount && bookingAmount < discountCode.minAmount) {
    throw new ValidationError(
      `This discount code requires a minimum booking amount of ${discountCode.minAmount}`
    );
  }
}; 