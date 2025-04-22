import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         url:
 *           type: string
 *           format: uri
 *           description: Payment link URL
 *         amount:
 *           type: number
 *           format: decimal
 *           description: Payment amount
 *         currency:
 *           type: string
 *           description: Currency code
 *           example: AED
 *         title:
 *           type: string
 *           description: Payment title
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     PaymentStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *           description: Current payment status
 *         amount:
 *           type: number
 *           format: decimal
 *           description: Payment amount
 *         currency:
 *           type: string
 *           description: Currency code
 *         paymentLink:
 *           type: string
 *           format: uri
 *           description: URL to the payment page
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the payment was completed (if applicable)
 *         refundedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the payment was refunded (if applicable)
 *
 * /bookings/{bookingId}/payment/link:
 *   post:
 *     summary: Create a payment link for a booking
 *     description: Generates a payment link for a specific booking that can be shared with the client
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking to create a payment link for
 *     responses:
 *       201:
 *         description: Payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment link created successfully"
 *                 paymentLink:
 *                   $ref: "#/components/schemas/PaymentLink"
 *       200:
 *         description: Payment link already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment link already exists for this booking"
 *                 paymentLink:
 *                   $ref: "#/components/schemas/PaymentLink"
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 *
 * /bookings/{bookingId}/payment/status:
 *   get:
 *     summary: Get payment status for a booking
 *     description: Retrieves the current payment status for a specific booking
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking to check payment status for
 *     responses:
 *       200:
 *         description: Payment status information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaymentStatus"
 *       404:
 *         description: Payment not found for this booking
 *       500:
 *         description: Server error
 *
 * /bookings/{bookingId}/payment/refund:
 *   post:
 *     summary: Refund a booking payment
 *     description: Processes a refund for a completed payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking to refund payment for
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for the refund
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment refunded successfully"
 *                 refundId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [REFUNDED]
 *       400:
 *         description: Invalid refund request (e.g., payment not completed)
 *       404:
 *         description: Booking or payment not found
 *       500:
 *         description: Server error
 *
 * /webhooks/payments:
 *   post:
 *     summary: Webhook for payment status updates
 *     description: Endpoint for payment providers to send status updates
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook payload
 *       500:
 *         description: Server error
 */

const router = Router();
const paymentController = new PaymentController();

// Payment endpoints
router.post('/bookings/:bookingId/payment/link', paymentController.createPaymentLinkForBooking);
router.get('/bookings/:bookingId/payment/status', paymentController.getPaymentStatus);
router.post('/bookings/:bookingId/payment/refund', paymentController.refundBookingPayment);

// Webhook endpoint
router.post('/webhooks/payments', paymentController.handlePaymentWebhook);

export default router; 