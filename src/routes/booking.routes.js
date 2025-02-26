import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { validateBookingRequest, validateDiscountCodeRequest } from '../middleware/validation.middleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     DiscountCode:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: The discount code (e.g., "WELCOME10")
 *         type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED_AMOUNT]
 *           description: Type of discount - percentage off or fixed amount
 *         value:
 *           type: number
 *           description: Value of the discount (percentage or fixed amount)
 *         minAmount:
 *           type: number
 *           description: Minimum booking amount required to use this code
 *         maxUses:
 *           type: number
 *           description: Maximum number of times this code can be used
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: When the discount code becomes valid
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: When the discount code expires
 * 
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: |
 *       Creates a new booking with optional discount code application.
 *       If a discount code is provided, it will be validated and applied to the booking immediately.
 *       
 *       Discount codes can be either:
 *       - Percentage based (e.g., "WELCOME10" for 10% off)
 *       - Fixed amount (e.g., "SPECIAL200" for 200 AED off)
 *       
 *       The discount will be applied to the base amount before VAT calculation.
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studioId
 *               - packageId
 *               - numberOfSeats
 *               - startTime
 *               - duration
 *               - lead
 *             properties:
 *               studioId:
 *                 type: string
 *                 format: uuid
 *               packageId:
 *                 type: string
 *                 format: uuid
 *               numberOfSeats:
 *                 type: integer
 *                 minimum: 1
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: integer
 *                 description: Duration in hours
 *               discountCode:
 *                 type: string
 *                 description: Optional discount code to apply during booking creation
 *               lead:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - phoneNumber
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Optional email address
 *                   phoneNumber:
 *                     type: string
 *                   whatsappNumber:
 *                     type: string
 *                     description: Optional WhatsApp contact number
 *                   recordingLocation:
 *                     type: string
 *                     description: Optional recording location
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 totalCost:
 *                   type: number
 *                   description: Final cost after discount and VAT
 *                 discountAmount:
 *                   type: number
 *                   description: Amount of discount applied
 *                 vatAmount:
 *                   type: number
 *                   description: VAT amount
 *       400:
 *         description: Invalid request data or discount code
 *       500:
 *         description: Server error
 * 
 * /bookings/apply-discount:
 *   post:
 *     summary: Apply a discount code to an existing booking
 *     description: |
 *       Applies a discount code to an existing booking. This endpoint is useful for:
 *       - Customer service adjustments after booking
 *       - Special promotions applied to existing bookings
 *       - Compensation or courtesy discounts
 *       - Cases where the customer decides to apply a discount code after creating the booking
 *       
 *       Note:
 *       - A booking can only have one discount code applied
 *       - The discount code must be valid and not expired
 *       - The booking amount must meet any minimum amount requirements
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - discountCode
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the existing booking
 *               discountCode:
 *                 type: string
 *                 description: Discount code to apply
 *     responses:
 *       200:
 *         description: Discount applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: |
 *           Invalid request. Possible reasons:
 *           - Invalid or expired discount code
 *           - Booking already has a discount applied
 *           - Booking amount below minimum required amount
 *           - Discount code usage limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /bookings/validate-discount:
 *   get:
 *     summary: Validate a discount code
 *     description: |
 *       Validates a discount code without applying it. Use this endpoint to:
 *       - Check if a discount code is valid
 *       - Get discount details (type, value, minimum amount)
 *       - Verify if the code has reached its usage limit
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The discount code to validate
 *     responses:
 *       200:
 *         description: Discount code validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   description: Whether the code is valid and can be used
 *                 type:
 *                   type: string
 *                   enum: [PERCENTAGE, FIXED_AMOUNT]
 *                   description: Type of discount (only if valid is true)
 *                 value:
 *                   type: number
 *                   description: Discount value (only if valid is true)
 *                 minAmount:
 *                   type: number
 *                   description: Minimum booking amount required (only if valid is true)
 *                 message:
 *                   type: string
 *                   description: Error message (only if valid is false)
 */

const router = Router();
const bookingController = new BookingController();

router.post('/', validateBookingRequest, bookingController.createBooking);
router.post('/apply-discount', validateDiscountCodeRequest, bookingController.applyDiscountCode);
router.get('/validate-discount', bookingController.validateDiscountCode);
router.get('/:id', bookingController.getBookingDetails);

export default router;