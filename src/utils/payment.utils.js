import axios from 'axios';
import {
  MAMO_BASE_URL,
  MAMO_API_KEY,
  MAMO_ENDPOINTS,
  MAMO_DEFAULTS,
  PAYMENT_STATUS
} from '../config/mamo.config.js';

/**
 * Creates a MamoPay API client with proper headers
 * @returns {Object} Axios instance configured for MamoPay
 */
export const createMamoClient = () => {
  if (!MAMO_API_KEY || MAMO_API_KEY.trim() === '') {
    console.warn('⚠️ Warning: MAMO_API_KEY is not set or is empty. MamoPay API calls will fail.');
  }
  
  // Create the axios instance
  const client = axios.create({
    baseURL: MAMO_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MAMO_API_KEY}`
    }
  });
  
  // Add interceptor for error logging
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Log API-specific errors
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('🔑 MamoPay API Authentication Error:', error.response.data || 'Unauthorized');
          console.error('   Please check your API key and permissions.');
        } else if (error.response.status === 404) {
          console.error('🔍 MamoPay API Endpoint Not Found:', error.config.url);
          console.error('   Please check the API endpoint configuration.');
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

/**
 * Creates a payment link for a booking
 * @param {Object} booking - The booking object
 * @param {Object} lead - Lead information for the booking
 * @returns {Promise<Object>} - The created payment link
 */
export const createPaymentLink = async (booking, lead) => {
  try {
    const client = createMamoClient();
    
    // Prepare the booking description
    const bookingDate = new Date(booking.startTime).toLocaleDateString('en-AE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const bookingTime = new Date(booking.startTime).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create payload for MamoPay
    const payload = {
      title: MAMO_DEFAULTS.TITLE,
      description: `Studio booking for ${bookingDate} at ${bookingTime}`,
      amount: Number(booking.totalCost),
      amount_currency: booking.package?.currency || MAMO_DEFAULTS.CURRENCY,
      return_url: MAMO_DEFAULTS.RETURN_URL,
      failure_return_url: MAMO_DEFAULTS.FAILURE_RETURN_URL,
      enable_customer_details: MAMO_DEFAULTS.ENABLE_CUSTOMER_DETAILS,
      send_customer_receipt: MAMO_DEFAULTS.SEND_CUSTOMER_RECEIPT,
      external_id: booking.id,
      custom_data: {
        bookingId: booking.id,
        studioId: booking.studioId,
        packageId: booking.packageId
      }
    };
    
    // If we have lead information, pre-fill customer details
    if (lead) {
      payload.first_name = lead.fullName.split(' ')[0] || '';
      payload.last_name = lead.fullName.split(' ').slice(1).join(' ') || '';
      payload.email = lead.email || '';
    }
    
    const response = await client.post(MAMO_ENDPOINTS.PAYMENT_LINKS, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating payment link:', error.response?.data || error.message);
    throw new Error(`Failed to create payment link: ${error.response?.data?.messages || error.message}`);
  }
};

/**
 * Fetches payment information from MamoPay
 * @param {string} paymentId - The payment ID from MamoPay
 * @returns {Promise<Object>} - The payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const client = createMamoClient();
    const response = await client.get(`${MAMO_ENDPOINTS.TRANSACTIONS}/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment details:', error.response?.data || error.message);
    throw new Error(`Failed to fetch payment details: ${error.response?.data?.messages || error.message}`);
  }
};

/**
 * Initiates a refund for a payment
 * @param {string} paymentId - The payment ID from MamoPay
 * @param {number} amount - The amount to refund
 * @param {string} reason - The reason for the refund
 * @returns {Promise<Object>} - The refund details
 */
export const refundPayment = async (paymentId, amount, reason = 'Booking cancelled') => {
  try {
    const client = createMamoClient();
    const response = await client.post(`${MAMO_ENDPOINTS.TRANSACTIONS}/${paymentId}/refund`, {
      amount,
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error refunding payment:', error.response?.data || error.message);
    throw new Error(`Failed to refund payment: ${error.response?.data?.messages || error.message}`);
  }
};

/**
 * Creates a webhook endpoint in MamoPay
 * @param {string} url - The URL to receive webhooks
 * @param {string} description - Description of the webhook
 * @returns {Promise<Object>} - The created webhook
 */
export const createWebhook = async (url, description = 'Booking payment webhooks') => {
  try {
    const client = createMamoClient();
    const response = await client.post(MAMO_ENDPOINTS.WEBHOOKS, {
      url,
      description
    });
    return response.data;
  } catch (error) {
    console.error('Error creating webhook:', error.response?.data || error.message);
    throw new Error(`Failed to create webhook: ${error.response?.data?.messages || error.message}`);
  }
};

/**
 * Maps MamoPay transaction status to our internal PaymentStatus
 * @param {string} mamoStatus - The status from MamoPay
 * @returns {string} - Our internal PaymentStatus
 */
export const mapMamoStatusToPaymentStatus = (mamoStatus) => {
  // Mapping based on MamoPay documentation
  const statusMap = {
    'created': PAYMENT_STATUS.PENDING,
    'processing': PAYMENT_STATUS.PENDING,
    'completed': PAYMENT_STATUS.COMPLETED,
    'failed': PAYMENT_STATUS.FAILED,
    'refunded': PAYMENT_STATUS.REFUNDED,
    'cancelled': PAYMENT_STATUS.FAILED
  };
  
  return statusMap[mamoStatus.toLowerCase()] || PAYMENT_STATUS.PENDING;
}; 