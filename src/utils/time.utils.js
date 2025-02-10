/**
 * Generates available time slots for a studio on a given date
 * @param {string} openingTime - Studio opening time (HH:mm)
 * @param {string} closingTime - Studio closing time (HH:mm)
 * @param {Array} bookings - Array of existing bookings
 * @returns {Array} Array of time slots with availability status
 */
export const generateAvailableTimeSlots = (openingTime, closingTime, bookings) => {
  // Convert opening and closing times to Date objects for the given date
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  // Get the date from the first booking or use current date
  const date = bookings.length > 0 
    ? new Date(bookings[0].startTime).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Create start and end time bounds
  const startBound = new Date(`${date}T${openingTime}:00`);
  const endBound = new Date(`${date}T${closingTime}:00`);

  // Generate 1-hour slots
  const slots = [];
  const slotDuration = 60; // minutes
  let currentSlot = new Date(startBound);

  while (currentSlot < endBound) {
    const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
    
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