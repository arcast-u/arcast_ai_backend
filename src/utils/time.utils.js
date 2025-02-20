/**
 * Generates available time slots for a studio on a given date
 * @param {string} openingTime - Studio opening time (HH:mm)
 * @param {string} closingTime - Studio closing time (HH:mm)
 * @param {Array} bookings - Array of existing bookings
 * @param {Date} targetDate - The specific date to generate slots for
 * @returns {Array} Array of time slots with availability status
 */
export const generateAvailableTimeSlots = (openingTime, closingTime, bookings, targetDate) => {
  // Convert opening and closing times to hours for comparison
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  const slots = [];

  // Ensure targetDate is a Date object and set to midnight UTC
  const targetDateObj = new Date(targetDate);
  
  // Create start and end times in UTC for the target date
  // Since Dubai is UTC+4, we need to subtract 4 hours from the local time
  const dayStart = new Date(Date.UTC(
    targetDateObj.getUTCFullYear(),
    targetDateObj.getUTCMonth(),
    targetDateObj.getUTCDate(),
    openHour - 4, // Convert from Dubai time to UTC
    openMinute
  ));

  const dayEnd = new Date(Date.UTC(
    targetDateObj.getUTCFullYear(),
    targetDateObj.getUTCMonth(),
    targetDateObj.getUTCDate(),
    closeHour - 4, // Convert from Dubai time to UTC
    closeMinute
  ));

  // Generate hourly slots for the day
  let currentSlot = new Date(dayStart);
  
  while (currentSlot < dayEnd) {
    const slotEnd = new Date(currentSlot.getTime() + 60 * 60 * 1000); // Add 1 hour

    // Check if slot overlaps with any booking
    const isAvailable = !bookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Convert all times to UTC timestamps for comparison
      const slotStartTime = currentSlot.getTime();
      const slotEndTime = slotEnd.getTime();
      const bookingStartTime = bookingStart.getTime();
      const bookingEndTime = bookingEnd.getTime();

      return (
        (slotStartTime >= bookingStartTime && slotStartTime < bookingEndTime) ||
        (slotEndTime > bookingStartTime && slotEndTime <= bookingEndTime) ||
        (slotStartTime <= bookingStartTime && slotEndTime >= bookingEndTime)
      );
    });

    slots.push({
      start: currentSlot.toISOString(),
      end: slotEnd.toISOString(),
      available: isAvailable
    });
    
    currentSlot = slotEnd;
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