import { ValidationError } from '../errors/custom.errors.js';
import { MAX_BOOKING_HOURS } from '../config/constants.config.js';

export const validateBookingRequest = (req, res, next) => {
  const { studioId, packageId, numberOfSeats, startTime, duration, lead } = req.body;

  if (!studioId || !packageId || !numberOfSeats || !startTime || !duration || !lead) {
    throw new ValidationError('Missing required booking fields');
  }

  if (!lead.email || !lead.fullName || !lead.phoneNumber) {
    throw new ValidationError('Missing required lead information');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lead.email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate duration
  if (duration <= 0 || duration > MAX_BOOKING_HOURS) {
    throw new ValidationError('Invalid booking duration');
  }

  next();
};

export const validateDiscountCodeRequest = (req, res, next) => {
  const { bookingId, discountCode } = req.body;

  if (!bookingId) {
    throw new ValidationError('Booking ID is required');
  }

  if (!discountCode) {
    throw new ValidationError('Discount code is required');
  }

  // Validate discount code format if needed
  if (typeof discountCode !== 'string' || discountCode.trim().length === 0) {
    throw new ValidationError('Invalid discount code format');
  }

  next();
};

export const validateCreateStudioRequest = (req, res, next) => {
  const { name, location, imageUrl, totalSeats, openingTime, closingTime, packages } = req.body;

  // Validate required fields
  if (!name || !location || !imageUrl || !totalSeats || !openingTime || !closingTime) {
    throw new ValidationError('Missing required studio fields');
  }

  // Validate time format (HH:mm)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
    throw new ValidationError('Invalid time format. Use HH:mm format');
  }

  // Validate totalSeats
  if (totalSeats <= 0) {
    throw new ValidationError('Total seats must be greater than 0');
  }

  // Validate packages if provided
  if (packages) {
    if (!Array.isArray(packages)) {
      throw new ValidationError('Packages must be an array');
    }

    packages.forEach((pkg, index) => {
      if (!pkg.name || !pkg.pricePerHour || !pkg.description || !pkg.deliveryTime) {
        throw new ValidationError(`Missing required fields in package at index ${index}`);
      }

      if (pkg.perks && !Array.isArray(pkg.perks)) {
        throw new ValidationError(`Perks must be an array in package at index ${index}`);
      }
    });
  }

  next();
};