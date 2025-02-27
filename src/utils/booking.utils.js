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
  const localStartTime = new Date(startTime);
  const localEndTime = new Date(endTime);
  
  // Extract hours and minutes and adjust for Dubai time
  const bookingStart = localStartTime.getUTCHours() * 60 + localStartTime.getUTCMinutes() + dubaiOffset;
  const bookingEnd = localEndTime.getUTCHours() * 60 + localEndTime.getUTCMinutes() + dubaiOffset;
  
  // Parse studio hours (these are already in Dubai time)
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);
  const studioOpen = openHour * 60 + openMinute;
  const studioClose = closeHour * 60 + closeMinute;

  // console.log('Time validation details:', {
  //   bookingStartMinutes: bookingStart,
  //   bookingEndMinutes: bookingEnd,
  //   studioOpenMinutes: studioOpen,
  //   studioCloseMinutes: studioClose,
  //   localStartTime: localStartTime.toISOString(),
  //   localEndTime: localEndTime.toISOString(),
  //   dubaiStartTime: `${Math.floor(bookingStart/60)}:${bookingStart%60}`,
  //   dubaiEndTime: `${Math.floor(bookingEnd/60)}:${bookingEnd%60}`,
  //   openingTime,
  //   closingTime
  // });

  // Check if booking is within operating hours
  if (bookingStart < studioOpen || bookingEnd > studioClose) {
    console.log('Booking outside operating hours');
    return false;
  }

  // Check for overlapping bookings
  const existingBookings = await db.booking.findMany({
    where: {
      studioId,
      status: { not: 'CANCELLED' },
      OR: [
        {
          AND: [
            { startTime: { lte: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ],
    },
  });

  if (existingBookings.length > 0) {
    console.log('Found overlapping bookings:', existingBookings);
  }

  return existingBookings.length === 0;
}
  