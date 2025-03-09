import { Router } from 'express';
import { AdditionalServiceController } from '../controllers/additionalService.controller.js';
import { validateAdditionalServiceRequest, validateAddServiceToBookingRequest } from '../middleware/validation.middleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     AdditionalService:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the additional service
 *         title:
 *           type: string
 *           description: Title of the additional service
 *         type:
 *           type: string
 *           enum: [STANDARD_EDIT_SHORT_FORM, CUSTOM_EDIT_SHORT_FORM, STANDARD_EDIT_LONG_FORM, CUSTOM_EDIT_LONG_FORM, LIVE_VIDEO_CUTTING, SUBTITLES, TELEPROMPTER_SUPPORT]
 *           description: Type of additional service
 *         price:
 *           type: number
 *           description: Price of the additional service
 *         currency:
 *           type: string
 *           description: "Currency of the price (default: AED)"
 *         count:
 *           type: integer
 *           description: Default count/quantity for this service
 *         description:
 *           type: string
 *           description: Description of the additional service
 *         imageUrls:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of images for the additional service
 *         videoUrl:
 *           type: string
 *           description: "URL of a video for the additional service (if applicable)"
 *         isActive:
 *           type: boolean
 *           description: Whether the additional service is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the additional service was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the additional service was last updated
 * 
 *     BookingAdditionalService:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the booking additional service
 *         bookingId:
 *           type: string
 *           format: uuid
 *           description: ID of the booking
 *         additionalServiceId:
 *           type: string
 *           format: uuid
 *           description: ID of the additional service
 *         quantity:
 *           type: integer
 *           description: Quantity of the additional service
 *         price:
 *           type: number
 *           description: Price of the additional service at the time of booking
 *         additionalService:
 *           $ref: '#/components/schemas/AdditionalService'
 *           description: Details of the additional service
 * 
 * /additional-services:
 *   post:
 *     summary: Create a new additional service
 *     description: Creates a new additional service with the provided details
 *     tags: [Additional Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - price
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STANDARD_EDIT_SHORT_FORM, CUSTOM_EDIT_SHORT_FORM, STANDARD_EDIT_LONG_FORM, CUSTOM_EDIT_LONG_FORM, LIVE_VIDEO_CUTTING, SUBTITLES, TELEPROMPTER_SUPPORT]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: AED
 *               count:
 *                 type: integer
 *                 default: 1
 *               description:
 *                 type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               videoUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Additional service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AdditionalService'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 * 
 *   get:
 *     summary: Get all additional services
 *     description: Returns a list of all additional services, with optional filtering by active status
 *     tags: [Additional Services]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of additional services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdditionalService'
 *       500:
 *         description: Server error
 * 
 * /additional-services/{id}:
 *   get:
 *     summary: Get an additional service by ID
 *     description: Returns details of a specific additional service
 *     tags: [Additional Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the additional service
 *     responses:
 *       200:
 *         description: Additional service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AdditionalService'
 *       404:
 *         description: Additional service not found
 *       500:
 *         description: Server error
 * 
 *   put:
 *     summary: Update an additional service
 *     description: Updates an existing additional service with the provided details
 *     tags: [Additional Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the additional service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STANDARD_EDIT_SHORT_FORM, CUSTOM_EDIT_SHORT_FORM, STANDARD_EDIT_LONG_FORM, CUSTOM_EDIT_LONG_FORM, LIVE_VIDEO_CUTTING, SUBTITLES, TELEPROMPTER_SUPPORT]
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               count:
 *                 type: integer
 *               description:
 *                 type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               videoUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Additional service updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AdditionalService'
 *       404:
 *         description: Additional service not found
 *       500:
 *         description: Server error
 * 
 *   delete:
 *     summary: Delete an additional service
 *     description: Deletes an additional service or marks it as inactive if it's in use
 *     tags: [Additional Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the additional service
 *     responses:
 *       200:
 *         description: Additional service deleted or marked as inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Additional service not found
 *       500:
 *         description: Server error
 * 
 * /bookings/{bookingId}/additional-services:
 *   post:
 *     summary: Add an additional service to a booking
 *     description: Adds an additional service to a booking with the specified quantity
 *     tags: [Bookings, Additional Services]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - additionalServiceId
 *             properties:
 *               additionalServiceId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the additional service to add
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 description: Quantity of the additional service
 *     responses:
 *       201:
 *         description: Additional service added to booking successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BookingAdditionalService'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Booking or additional service not found
 *       500:
 *         description: Server error
 * 
 *   get:
 *     summary: Get all additional services for a booking
 *     description: Returns a list of all additional services for a specific booking
 *     tags: [Bookings, Additional Services]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking
 *     responses:
 *       200:
 *         description: List of additional services for the booking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingAdditionalService'
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 * 
 * /bookings/{bookingId}/additional-services/{additionalServiceId}:
 *   delete:
 *     summary: Remove an additional service from a booking
 *     description: Removes an additional service from a booking
 *     tags: [Bookings, Additional Services]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the booking
 *       - in: path
 *         name: additionalServiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the additional service
 *     responses:
 *       200:
 *         description: Additional service removed from booking successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Booking or additional service not found
 *       500:
 *         description: Server error
 */

const router = Router();
const additionalServiceController = new AdditionalServiceController();

// Additional service routes
router.post('/', validateAdditionalServiceRequest, additionalServiceController.createAdditionalService);
router.get('/', additionalServiceController.getAllAdditionalServices);
router.get('/:id', additionalServiceController.getAdditionalServiceById);
router.put('/:id', additionalServiceController.updateAdditionalService);
router.delete('/:id', additionalServiceController.deleteAdditionalService);

// Booking additional service routes
router.post('/booking/:bookingId', validateAddServiceToBookingRequest, additionalServiceController.addServiceToBooking);
router.get('/booking/:bookingId', additionalServiceController.getBookingAdditionalServices);
router.delete('/booking/:bookingId/:additionalServiceId', additionalServiceController.removeServiceFromBooking);

export default router; 