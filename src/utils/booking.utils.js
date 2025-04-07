/**
 * Calculate base cost for a booking without discounts or VAT
 * @param {number} pricePerHour - Price per hour for the package
 * @param {number} duration - Duration in hours
 * @returns {number} Base cost
 */
export const calculateBaseCost = (pricePerHour, duration) => {
  return Number(pricePerHour) * duration;
};

/**
 * Calculate total cost including discounts and VAT
 * @param {object} prisma - Prisma client instance
 * @param {number} pricePerHour - Price per hour for the package
 * @param {number} duration - Duration in hours
 * @param {string} discountCode - Optional discount code
 * @param {number} vatRate - VAT rate as decimal
 * @returns {object} Object containing totalCost, vatAmount, and discountAmount
 */
export function calculateTotalCostWithDiscount(prisma, pricePerHour, duration, discountCode, vatRate) {
    const baseAmount = parseFloat(pricePerHour) * duration;
    let discountAmount = 0;
  
    if (discountCode) {
      discountAmount = calculateDiscountAmount(discountCode, baseAmount);
    }
  
    const discountedAmount = baseAmount - discountAmount;
    const vatAmount = discountedAmount * vatRate;
    const totalCost = discountedAmount + vatAmount;
  
    return {
      totalCost,
      vatAmount,
      discountAmount
    };
}

/**
 * Validate if a booking time is available
 * @param {object} db - Prisma client or transaction instance
 * @param {string} studioId - ID of the studio
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @param {string} openingTime - Studio opening time (HH:mm)
 * @param {string} closingTime - Studio closing time (HH:mm)
 * @returns {Promise<boolean>} Whether the time slot is available
 */
export async function validateBookingTime(
  db,
  studioId,
  startTime,
  endTime,
  openingTime,
  closingTime
) {
  // Convert UTC booking times to Dubai time (UTC+4)
  const dubaiOffset = 4 * 60; // 4 hours in minutes
  
  // Extract hours and minutes and adjust for Dubai time
  const bookingStart = startTime.getUTCHours() * 60 + startTime.getUTCMinutes() + dubaiOffset;
  const bookingEnd = endTime.getUTCHours() * 60 + endTime.getUTCMinutes() + dubaiOffset;
  
  // Parse studio hours (these are already in Dubai time)
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);
  const studioOpen = openHour * 60 + openMinute;
  const studioClose = closeHour * 60 + closeMinute;

  // Check if booking is within operating hours
  if (bookingStart < studioOpen || bookingEnd > studioClose) {
    return false;
  }

  // Use count instead of findMany to be more efficient - we only need to know if any exist
  const overlappingBookingsCount = await db.booking.count({
    where: {
      studioId,
      status: { not: 'CANCELLED' },
      startTime: { lt: endTime },
      endTime: { gt: startTime }
    },
  });

  return overlappingBookingsCount === 0;
}
  