/**
 * MamoPay API configuration
 * This file contains all the configuration settings for MamoPay integration
 */

// MamoPay environments
export const MAMO_ENVIRONMENTS = {
  SANDBOX: 'sandbox',
  PRODUCTION: 'production'
};

// MamoPay API endpoints based on environment
export const MAMO_API_URLS = {
  [MAMO_ENVIRONMENTS.SANDBOX]: 'https://sandbox.dev.business.mamopay.com/manage_api/v1',
  [MAMO_ENVIRONMENTS.PRODUCTION]: 'https://business.mamopay.com/manage_api/v1'
};

// Get the current MamoPay environment from env variables (default to sandbox)
export const MAMO_ENVIRONMENT = process.env.MAMO_ENVIRONMENT || MAMO_ENVIRONMENTS.SANDBOX;

// MamoPay API key
export const MAMO_API_KEY = process.env.MAMO_API_KEY || '';

// Base URL for the current environment
export const MAMO_BASE_URL = MAMO_API_URLS[MAMO_ENVIRONMENT];

// MamoPay API endpoints
export const MAMO_ENDPOINTS = {
  PAYMENT_LINKS: '/links',
  CHARGES: '/charges',
  TRANSACTIONS: '/transactions',
  WEBHOOKS: '/webhooks',
  BUSINESS: '/business'
};

// Payment link configuration defaults
export const MAMO_DEFAULTS = {
  TITLE: 'Arcast AI Booking',
  CURRENCY: 'AED',
  RETURN_URL: process.env.MAMO_RETURN_URL || 'https://arcast.ai/booking/confirmation',
  FAILURE_RETURN_URL: process.env.MAMO_FAILURE_RETURN_URL || 'https://arcast.ai/booking/failed',
  ENABLE_CUSTOMER_DETAILS: true,
  SEND_CUSTOMER_RECEIPT: true
};

// Payment Status mappings
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

// BookingStatus to PaymentStatus mapping
export const BOOKING_TO_PAYMENT_STATUS = {
  PENDING: PAYMENT_STATUS.PENDING,
  CONFIRMED: PAYMENT_STATUS.COMPLETED,
  CANCELLED: PAYMENT_STATUS.FAILED,
  COMPLETED: PAYMENT_STATUS.COMPLETED
}; 