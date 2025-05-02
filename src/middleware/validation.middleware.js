import { ValidationError } from '../errors/custom.errors.js';
import { MAX_BOOKING_HOURS } from '../config/constants.config.js';

export const validateBookingRequest = (req, res, next) => {
  const { studioId, packageId, numberOfSeats, startTime, duration, lead, additionalServices } = req.body;

  if (!studioId || !packageId || !numberOfSeats || !startTime || !duration || !lead) {
    throw new ValidationError('Missing required booking fields');
  }

  if (!lead.fullName) {
    throw new ValidationError('Missing required lead information: fullName is required');
  }

  // Validate email format if provided
  if (lead.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  // Validate duration
  if (duration <= 0 || duration > MAX_BOOKING_HOURS) {
    throw new ValidationError('Invalid booking duration');
  }

  // Validate additional services if provided
  if (additionalServices) {
    if (!Array.isArray(additionalServices)) {
      throw new ValidationError('Additional services must be an array');
    }

    for (const service of additionalServices) {
      if (!service.id) {
        throw new ValidationError('Each additional service must have an ID');
      }

      if (service.quantity && (!Number.isInteger(service.quantity) || service.quantity <= 0)) {
        throw new ValidationError('Additional service quantity must be a positive integer');
      }
    }
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

export const validateAdditionalServiceRequest = (req, res, next) => {
  const { title, type, price, description } = req.body;

  if (!title || !type || !price || !description) {
    throw new ValidationError('Missing required additional service fields: title, type, price, and description are required');
  }

  // Validate price
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    throw new ValidationError('Price must be a positive number');
  }

  // Validate type
  const validTypes = [
    'STANDARD_EDIT_SHORT_FORM',
    'CUSTOM_EDIT_SHORT_FORM',
    'STANDARD_EDIT_LONG_FORM',
    'CUSTOM_EDIT_LONG_FORM',
    'LIVE_VIDEO_CUTTING',
    'SUBTITLES',
    'TELEPROMPTER_SUPPORT',
    'MULTI_CAM_RECORDING'
  ];

  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid service type. Must be one of: ${validTypes.join(', ')}`);
  }

  next();
};

export const validateAddServiceToBookingRequest = (req, res, next) => {
  const { bookingId, additionalServiceId, quantity } = req.body;

  if (!bookingId || !additionalServiceId) {
    throw new ValidationError('Missing required fields: bookingId and additionalServiceId are required');
  }

  if (quantity && (!Number.isInteger(quantity) || quantity <= 0)) {
    throw new ValidationError('Quantity must be a positive integer');
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

export const validateCreateLeadRequest = (req, res, next) => {
  const { fullName, email, phoneNumber } = req.body;

  // Check required fields
  if (!fullName || !email) {
    throw new ValidationError('Missing required fields: fullName and email are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate phone number format if provided
  if (phoneNumber) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      throw new ValidationError('Invalid phone number format');
    }
  }

  // Validate fullName length
  if (fullName.trim().length < 2) {
    throw new ValidationError('Full name must be at least 2 characters long');
  }

  next();
};