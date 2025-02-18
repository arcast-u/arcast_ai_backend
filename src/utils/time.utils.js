/**
 * Generates available time slots for a studio on a given date
 * @param {string} openingTime - Studio opening time (HH:mm)
 * @param {string} closingTime - Studio closing time (HH:mm)
 * @param {Array} bookings - Array of existing bookings
 * @param {Date} endDate - The end date to check availability until
 * @returns {Array} Array of time slots with availability status
 */
export const generateAvailableTimeSlots = (openingTime, closingTime, bookings, endDate) => {
  // Convert opening and closing times to hours for comparison
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  // Get today's date at midnight for consistent comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = [];
  const currentDate = new Date(today);

  // Generate slots for each day from today until endDate
  while (currentDate <= endDate) {
    // Set opening and closing times for the current date
    const dayStart = new Date(currentDate);
    dayStart.setHours(openHour, openMinute, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(closeHour, closeMinute, 0, 0);

    // Generate hourly slots for the current day
    let currentSlot = new Date(dayStart);
    
    while (currentSlot < dayEnd) {
      const slotEnd = new Date(currentSlot.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      // Only include future slots
      if (currentSlot > new Date()) {
        // Check if slot overlaps with any booking
        const isAvailable = !bookings.some(booking => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return (
            (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (currentSlot <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        slots.push({
          start: currentSlot.toISOString(),
          end: slotEnd.toISOString(),
          available: isAvailable
        });
      }
      
      currentSlot = slotEnd;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

/**
 * Validates if a time string is in HH:mm format
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Checks if a time is within studio operating hours
 * @param {string} time - Time to check (HH:mm)
 * @param {string} openingTime - Studio opening time (HH:mm)
 * @param {string} closingTime - Studio closing time (HH:mm)
 * @returns {boolean} True if within operating hours, false otherwise
 */
export const isWithinOperatingHours = (time, openingTime, closingTime) => {
  const [timeHour, timeMinute] = time.split(':').map(Number);
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  const timeMinutes = timeHour * 60 + timeMinute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
};

function isTimeSlotConflicting(timeSlot, booking) {
  const slotStart = new Date(`1970-01-01T${timeSlot.start}`);
  const slotEnd = new Date(`1970-01-01T${timeSlot.end}`);
  const bookingStart = new Date(booking.startTime);
  const bookingEnd = new Date(booking.endTime);

  return (
    (slotStart >= bookingStart && slotStart < bookingEnd) ||
    (slotEnd > bookingStart && slotEnd <= bookingEnd)
  );
}