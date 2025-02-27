/**
 * Webhook configuration
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Webhook configuration
export const WEBHOOK_CONFIG = {
  // Trigger.dev webhook configuration
  TRIGGER_DEV: {
    BOOKING_WEBHOOK_URL: process.env.TRIGGER_DEV_BOOKING_WEBHOOK_URL || 'https://api.trigger.dev/api/v1/tasks/my-task/trigger',
    BOOKING_WEBHOOK_TOKEN: process.env.TRIGGER_DEV_BOOKING_WEBHOOK_TOKEN || 'tr_dev_1234',
    ENABLED: process.env.TRIGGER_DEV_WEBHOOK_ENABLED === 'true' || false
  }
};

// Default export for convenience
export default WEBHOOK_CONFIG; 