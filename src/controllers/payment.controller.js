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
    
    
    // Extract the event type directly from the payload
    const eventType = webhookPayload.event_type;
    
    // Log the extracted information based on event type
    if (eventType === 'payment_link.create') {
      console.log('🔄 Received payment link creation webhook:', {
        event: eventType,
        linkId: webhookPayload.id,
        title: webhookPayload.title,
        externalId: webhookPayload.external_id,
        customData: webhookPayload.custom_data
      });
    } else if (eventType === 'charge.succeeded' || eventType === 'charge.failed') {
      console.log('🔄 Received payment charge webhook:', {
        event: eventType,
        chargeId: webhookPayload.id,
        status: webhookPayload.status,
        externalId: webhookPayload.external_id,
        customData: webhookPayload.custom_data,
        paymentLinkId: webhookPayload.payment_link_id
      });
    } else {
      console.log(`🔄 Received MamoPay webhook of type: ${eventType || 'unknown'}`);
    }
    
    try {
      // Log the webhook event
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          provider: 'MAMO_PAY',
          eventType: eventType || 'unknown',
          payload: webhookPayload,
          status: 'received'
        }
      });
      console.log(`✅ Webhook event logged with ID: ${webhookEvent.id}`);

      // Process based on event type
      if (eventType === 'charge.succeeded' || eventType === 'charge.failed') {
        console.log(`🔍 Processing ${eventType} event`);
        
        // With charge webhooks, data is at the root level of the payload
        const transactionId = webhookPayload.id;
        const customData = webhookPayload.custom_data || {};
        const bookingId = customData.bookingId || webhookPayload.external_id;
        
        console.log(`📊 Payment data: transactionId=${transactionId}, bookingId=${bookingId}`);

        if (!bookingId) {
          console.error('❌ Missing booking ID in webhook payload');
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
        const mamoStatus = webhookPayload.status || '';
        const paymentStatus = mapMamoStatusToPaymentStatus(mamoStatus);
        console.log(`🔄 Mapped MamoPay status '${mamoStatus}' to internal status '${paymentStatus}'`);

        // Update booking and payment in a transaction
        console.log(`🔄 Starting database transaction for bookingId=${bookingId}`);
        try {
          await prisma.$transaction(async (tx) => {
            // Update the payment
            const payment = await tx.payment.findFirst({
              where: { bookingId }
            });

            if (payment) {
              console.log(`✅ Found payment record: paymentId=${payment.id}, status=${payment.status}`);
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: paymentStatus,
                  externalId: transactionId,
                  completedAt: paymentStatus === PAYMENT_STATUS.COMPLETED ? new Date() : null,
                  metadata: { ...payment.metadata, webhook: webhookPayload }
                }
              });
              console.log(`✅ Updated payment status to: ${paymentStatus}`);
            } else {
              console.warn(`⚠️ No payment record found for bookingId=${bookingId}`);
            }

            // Update the booking status if payment is completed
            if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
              console.log(`🔄 Payment completed, updating booking status to CONFIRMED`);
              try {
                // Update booking status to CONFIRMED
                await tx.booking.update({
                  where: { id: bookingId },
                  data: {
                    status: 'CONFIRMED'
                  }
                });
                console.log(`✅ Updated booking status to CONFIRMED`);
              } catch (bookingUpdateError) {
                console.error(`❌ Failed to update booking status: ${bookingUpdateError.message}`);
                throw bookingUpdateError;
              }
              
              // Fetch the complete booking object with related data for the webhook
              console.log(`🔄 Fetching complete booking data for webhook notification`);
              try {
                const completedBooking = await tx.booking.findUnique({
                  where: { id: bookingId },
                  include: {
                    studio: true,
                    package: true,
                    lead: true
                  }
                });
                
                if (completedBooking) {
                  console.log(`✅ Found completed booking data: studio=${completedBooking.studio?.name}, package=${completedBooking.package?.name}, lead=${completedBooking.lead?.fullName}`);
                  
                  // Send webhook notification with the complete booking object
                  try {
                    console.log(`🔄 Importing webhook config and utility`);
                    const { WEBHOOK_CONFIG } = await import('../config/webhook.config.js');
                    const { sendWebhookNotification } = await import('../utils/webhook.utils.js');
                    
                    console.log(`🔄 Preparing to send webhook notification to: ${WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_URL}`);
                    await sendWebhookNotification(
                      WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_URL,
                      WEBHOOK_CONFIG.TRIGGER_DEV.BOOKING_WEBHOOK_TOKEN,
                      completedBooking
                    );
                    
                    console.log(`✅ Webhook notification sent successfully for confirmed booking: ${bookingId}`);
                  } catch (webhookError) {
                    console.error('❌ Failed to send webhook notification:', webhookError);
                    console.error('Webhook error details:', webhookError.stack);
                    // We don't want to fail the transaction if the webhook fails
                  }
                } else {
                  console.warn(`⚠️ Could not find booking data after status update for bookingId=${bookingId}`);
                }
              } catch (bookingFetchError) {
                console.error(`❌ Failed to fetch booking data: ${bookingFetchError.message}`);
                // Don't throw here to allow transaction to complete
              }
            } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
              console.log(`🔄 Payment failed, updating booking status to CANCELLED`);
              // Optionally update booking status on payment failure
              try {
                await tx.booking.update({
                  where: { id: bookingId },
                  data: {
                    status: 'CANCELLED'
                  }
                });
                console.log(`✅ Updated booking status to CANCELLED due to payment failure`);
              } catch (bookingUpdateError) {
                console.error(`❌ Failed to update booking status to CANCELLED: ${bookingUpdateError.message}`);
                throw bookingUpdateError;
              }
            }

            // Update webhook event status
            await tx.webhookEvent.update({
              where: { id: webhookEvent.id },
              data: {
                status: 'processed',
                processedAt: new Date()
              }
            });
            console.log(`✅ Updated webhook event status to 'processed'`);
          });
          console.log(`✅ Database transaction completed successfully`);
        } catch (transactionError) {
          console.error(`❌ Transaction failed: ${transactionError.message}`);
          console.error('Transaction error stack:', transactionError.stack);
          throw transactionError;
        }

        return res.status(200).json({ message: 'Webhook processed successfully' });
      } else if (eventType === 'payment_link.create') {
        // For payment link creation, we just acknowledge receipt
        console.log(`ℹ️ Received payment link creation webhook, no further action needed`);
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            status: 'acknowledged',
            processedAt: new Date()
          }
        });
        console.log(`✅ Acknowledged payment link creation webhook`);
      } else {
        console.log(`ℹ️ Received unhandled webhook event type: ${eventType || 'unknown'}`);
        // For other event types, just acknowledge receipt
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            status: 'acknowledged',
            processedAt: new Date()
          }
        });
        console.log(`✅ Acknowledged webhook event: ${eventType || 'unknown'}`);
      }

      res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      console.error('Error stack:', error.stack);
      
      // Log the error in the webhook event
      if (webhookEvent) {
        try {
          await prisma.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: {
              status: 'error',
              processedAt: new Date(),
              payload: { ...webhookPayload, error: error.message }
            }
          });
          console.log(`✅ Updated webhook event with error status`);
        } catch (updateError) {
          console.error('❌ Error updating webhook event:', updateError);
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