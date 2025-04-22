# MamoPay Integration Guide

This document outlines the MamoPay payment integration with the Arcast AI Backend.

## Overview

The integration allows customers to pay for their studio bookings using MamoPay. The payment flow is as follows:

1. Customer creates a booking
2. The system generates a payment link using MamoPay
3. Customer is redirected to the payment link to complete payment
4. MamoPay sends a webhook notification when payment is completed
5. The system updates the booking status based on the payment result

## Configuration

The MamoPay integration requires the following environment variables:

```
MAMO_ENVIRONMENT=sandbox     # Use 'production' for live payments
MAMO_API_KEY=your_api_key    # Your MamoPay API key
MAMO_RETURN_URL=https://arcast.ai/booking/confirmation      # Redirect URL after successful payment
MAMO_FAILURE_RETURN_URL=https://arcast.ai/booking/failed   # Redirect URL after failed payment
```

## Setup Instructions

### Database Migration

Run the following command to apply the database schema changes:

```bash
npx prisma migrate dev --name add_mamo_payment_models
```

### Setting up the Webhook

1. Login to your MamoPay dashboard
2. Navigate to Developer > Webhooks
3. Create a new webhook with the URL: `https://your-api-domain.com/api/webhooks/payments`
4. Ensure the webhook is configured to receive the following events:
   - `charge.completed`
   - `charge.failed`
   - `charge.refunded`

## API Endpoints

### Create Payment Link

```
POST /api/bookings/:bookingId/payment/link
```

Creates a payment link for a specific booking.

### Check Payment Status

```
GET /api/bookings/:bookingId/payment/status
```

Retrieves the current payment status for a specific booking.

### Refund Payment

```
POST /api/bookings/:bookingId/payment/refund
```

Processes a refund for a completed payment.

## Integration Testing

You can test the integration using MamoPay's sandbox environment:

1. Set `MAMO_ENVIRONMENT=sandbox` in your environment variables
2. Use the test API key provided by MamoPay
3. Use the following test card information:
   - Card Number: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVV: Any 3 digits

## Webhook Processing

When a payment status changes, MamoPay sends a webhook to the configured endpoint. The system:

1. Logs the webhook event
2. Updates the payment status
3. Updates the booking status accordingly
4. Sends a response to acknowledge receipt

## Troubleshooting

Common issues and their solutions:

1. **Webhook not being received**:
   - Ensure the webhook URL is publicly accessible
   - Check that the webhook is properly configured in the MamoPay dashboard

2. **Payment creation fails**:
   - Verify the MAMO_API_KEY is correct
   - Check that the booking details are valid

3. **Payment status not updating**:
   - Check the webhook logs in the WebhookEvent table
   - Verify the webhook is being received and processed

## Security Considerations

- MamoPay API keys should be kept secure and never exposed to the client
- Webhook endpoints should validate the request to ensure it comes from MamoPay
- HTTPS should be used for all API endpoints 