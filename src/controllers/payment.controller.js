import prisma from '../config/db.config.js';
import {
  createPaymentLink,
  getPaymentDetails,
  refundPayment,
  mapMamoStatusToPaymentStatus
} from '../utils/payment.utils.js';
import { PAYMENT_STATUS } from '../config/mamo.config.js';

export class PaymentController {
  /**
   * Create a payment link for a booking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createPaymentLinkForBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
      // Fetch booking with related data
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          lead: true,
          package: true,
          studio: true
        }
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if booking already has a payment
      const existingPayment = await prisma.payment.findUnique({
        where: { bookingId: booking.id },
        include: { paymentLink: true }
      });

      // If there's an existing payment link, return it unless it's failed
      if (existingPayment && existingPayment.paymentLink && existingPayment.status !== PAYMENT_STATUS.FAILED) {
        return res.status(200).json({
          message: 'Payment link already exists for this booking',
          paymentLink: existingPayment.paymentLink
        });
      }

      // Create new payment link through MamoPay
      const mamoPaymentLink = await createPaymentLink(booking, booking.lead);

      // Begin transaction to create/update payment records
      const result = await prisma.$transaction(async (tx) => {
        // Create a new payment link record
        const paymentLink = await tx.paymentLink.create({
          data: {
            url: mamoPaymentLink.payment_url,
            externalId: mamoPaymentLink.id,
            provider: 'MAMO_PAY',
            amount: booking.totalCost,
            currency: booking.package.currency || 'AED',
            title: mamoPaymentLink.title,
            description: mamoPaymentLink.description,
            metadata: mamoPaymentLink
          }
        });

        // Create or update the payment record
        let payment;
        if (existingPayment) {
          payment = await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PAYMENT_STATUS.PENDING,
              paymentLinkId: paymentLink.id,
              metadata: mamoPaymentLink
            }
          });
        } else {
          payment = await tx.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.totalCost,
              currency: booking.package.currency || 'AED',
              status: PAYMENT_STATUS.PENDING,
              provider: 'MAMO_PAY',
              paymentLinkId: paymentLink.id,
              metadata: mamoPaymentLink
            }
          });
        }

        return { paymentLink, payment };
      });

      res.status(201).json({
        message: 'Payment link created successfully',
        paymentLink: result.paymentLink
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Handle payment status callback/webhook
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  handlePaymentWebhook = async (req, res) => {
    const webhookPayload = req.body;
    
    try {
      // Log the webhook event
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          provider: 'MAMO_PAY',
          eventType: webhookPayload.event || 'unknown',
          payload: webhookPayload,
          status: 'received'
        }
      });

      // Process based on event type
      if (webhookPayload.event === 'charge.completed' || webhookPayload.event === 'charge.failed') {
        const transactionId = webhookPayload.data?.id;
        const customData = webhookPayload.data?.custom_data || {};
        const bookingId = customData.bookingId || webhookPayload.data?.external_id;

        if (!bookingId) {
          await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              status: 'failed',
              processedAt: new Date(),
            }
          });
          return res.status(400).json({ error: 'Missing booking ID in webhook payload' });
        }

        // Map MamoPay status to internal status
        const mamoStatus = webhookPayload.data?.status || '';
        const paymentStatus = mapMamoStatusToPaymentStatus(mamoStatus);

        // Update booking and payment in a transaction
        await prisma.$transaction(async (tx) => {
          // Update the payment
          const payment = await tx.payment.findFirst({
            where: { bookingId }
          });

          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: paymentStatus,
                externalId: transactionId,
                completedAt: paymentStatus === PAYMENT_STATUS.COMPLETED ? new Date() : null,
                metadata: { ...payment.metadata, webhook: webhookPayload }
              }
            });
          }

          // Update the booking status if payment is completed
          if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
            // Update booking status to CONFIRMED
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'CONFIRMED'
              }
            });
            
            // Fetch the complete booking object with related data for the webhook
            const completedBooking = await tx.booking.findUnique({
              where: { id: bookingId },
              include: {
                studio: true,
                package: true,
                lead: true
              }
            });
            
            // Send webhook notification with the complete booking object
            if (completedBooking) {
              try {
                const { WEBHOOK_CONFIG } = await import('../config/webhook.config.js');
                const { sendWebhookNotification } = await import('../utils/webhook.utils.js');
                
                await sendWebhookNotification(
                  WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_URL,
                  WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_TOKEN,
                  completedBooking
                );
                
                console.log(`Webhook notification sent for confirmed booking: ${bookingId}`);
              } catch (webhookError) {
                console.error('Failed to send webhook notification for confirmed booking:', webhookError);
                // We don't want to fail the transaction if the webhook fails
              }
            }
          } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
            // Optionally update booking status on payment failure
            // This depends on business logic -  might want to keep it as PENDING
            // to allow for retries, or mark it as CANCELLED
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                status: 'CANCELLED'
              }
            });
          }

          // Update webhook event status
          await tx.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              status: 'processed',
              processedAt: new Date()
            }
          });
        });

        return res.status(200).json({ message: 'Webhook processed successfully' });
      }

      // For other event types, just acknowledge receipt
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'acknowledged',
          processedAt: new Date()
        }
      });

      res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      
      // Log the error in the webhook event
      if (webhookPayload) {
        try {
          await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              status: 'error',
              processedAt: new Date(),
              payload: { ...webhookPayload, error: error.message }
            }
          });
        } catch (updateError) {
          console.error('Error updating webhook event:', updateError);
        }
      }
      
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get payment status for a booking
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPaymentStatus = async (req, res) => {
    const { bookingId } = req.params;

    try {
      const payment = await prisma.payment.findUnique({
        where: { bookingId },
        include: { paymentLink: true }
      });

      if (!payment) {
        return res.status(404).json({ error: 'No payment found for this booking' });
      }

      // If the payment has a MamoPay ID and is not completed/failed, fetch the latest status
      if (payment.externalId && ![PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.REFUNDED].includes(payment.status)) {
        try {
          const paymentDetails = await getPaymentDetails(payment.externalId);
          const latestStatus = mapMamoStatusToPaymentStatus(paymentDetails.status);
          
          // Update status if it has changed
          if (latestStatus !== payment.status) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: latestStatus,
                completedAt: latestStatus === PAYMENT_STATUS.COMPLETED ? new Date() : payment.completedAt,
                refundedAt: latestStatus === PAYMENT_STATUS.REFUNDED ? new Date() : payment.refundedAt,
                metadata: { ...payment.metadata, latest: paymentDetails }
              }
            });
            
            // If payment is completed, update booking status
            if (latestStatus === PAYMENT_STATUS.COMPLETED) {
              await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'CONFIRMED' }
              });
            }
            
            // Refresh payment data after update
            payment.status = latestStatus;
          }
        } catch (error) {
          console.error('Error fetching latest payment status:', error);
          // Continue with the existing payment data
        }
      }

      res.status(200).json({
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentLink: payment.paymentLink?.url,
        completedAt: payment.completedAt,
        refundedAt: payment.refundedAt
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Process refund for a booking payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refundBookingPayment = async (req, res) => {
    const { bookingId } = req.params;
    const { reason } = req.body;

    try {
      // Get booking and payment
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const payment = await prisma.payment.findUnique({
        where: { bookingId }
      });

      if (!payment) {
        return res.status(404).json({ error: 'No payment found for this booking' });
      }

      if (payment.status !== PAYMENT_STATUS.COMPLETED) {
        return res.status(400).json({ error: 'Only completed payments can be refunded' });
      }

      if (!payment.externalId) {
        return res.status(400).json({ error: 'Missing payment provider ID' });
      }

      // Process refund with MamoPay
      const refundResult = await refundPayment(
        payment.externalId,
        Number(payment.amount),
        reason || 'Booking cancelled'
      );

      // Update payment status to refunded
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.REFUNDED,
          refundedAt: new Date(),
          metadata: { ...payment.metadata, refund: refundResult }
        }
      });

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });

      res.status(200).json({
        message: 'Payment refunded successfully',
        refundId: refundResult.id,
        amount: payment.amount,
        status: PAYMENT_STATUS.REFUNDED
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({ error: error.message });
    }
  };
} 