/**
 * Webhook utilities for sending HTTP requests to external services
 */
import https from 'https';
import { URL } from 'url';
import { formatBookingWithDubaiTime } from './time.utils.js';

/**
 * Send a webhook notification to an external service
 * 
 * @param {string} webhookUrl - The URL of the webhook endpoint
 * @param {string} authToken - The authentication token for the webhook
 * @param {object} payload - The data to send to the webhook
 * @returns {Promise<object>} - The response from the webhook
 */
export const sendWebhookNotification = async (webhookUrl, authToken, payload) => {
  return new Promise((resolve, reject) => {
    try {
      // Parse the URL
      const parsedUrl = new URL(webhookUrl);
      
      // Convert booking times to Dubai timezone (UTC+4)
      const dubaiTimePayload = formatBookingWithDubaiTime(payload);
      
      // Prepare the request options
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      };

      // Create the request
      const req = https.request(options, (res) => {
        let data = '';
        
        // Collect response data
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // Process the complete response
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = data ? JSON.parse(data) : {};
              resolve({
                success: true,
                statusCode: res.statusCode,
                data: parsedData
              });
            } catch (error) {
              resolve({
                success: true,
                statusCode: res.statusCode,
                data: data
              });
            }
          } else {
            reject({
              success: false,
              statusCode: res.statusCode,
              message: `Webhook request failed with status code: ${res.statusCode}`,
              data: data
            });
          }
        });
      });
      
      // Handle request errors
      req.on('error', (error) => {
        reject({
          success: false,
          message: 'Error sending webhook notification',
          error: error.message
        });
      });
      
      // Format the payload for the webhook
      const formattedPayload = { payload: dubaiTimePayload };
      
      // Send the payload
      const jsonPayload = JSON.stringify(formattedPayload);
      req.write(jsonPayload);
      req.end();
      console.log(`📤 Request sent, waiting for response...`);
    } catch (error) {
      console.error(`❌ Error preparing webhook request: ${error.message}`);
      console.error(error.stack);
      reject({
        success: false,
        message: 'Error preparing webhook request',
        error: error.message
      });
    }
  });
}; 