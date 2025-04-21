import { Router } from 'express';
import { StudioController } from '../controllers/studio.controller.js';
import { validateCreateStudioRequest } from '../middleware/validation.middleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     PackagePerk:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the perk
 *         count:
 *           type: integer
 *           description: "Optional count for items (e.g., \"3x Sony cameras\")"
 * 
 *     StudioPackage:
 *       type: object
 *       required:
 *         - name
 *         - price_per_hour
 *         - description
 *         - delivery_time
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The package ID
 *         name:
 *           type: string
 *           description: Name of the package
 *           example: "Recording (Video + Audio)"
 *         price_per_hour:
 *           type: number
 *           format: decimal
 *           description: Price per hour for the package
 *           example: 950.00
 *         currency:
 *           type: string
 *           default: AED
 *           description: Currency for the price
 *         description:
 *           type: string
 *           description: Description of the package
 *           example: "Professional recording package with multi-camera setup and high-quality audio"
 *         delivery_time:
 *           type: integer
 *           description: Delivery time in hours
 *           example: 24
 *         studioId:
 *           type: string
 *           format: uuid
 *           description: ID of the studio if it's a custom package, null if it's a default package
 *           nullable: true
 *         perks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PackagePerk'
 *           description: List of perks included in the package
 *           example:
 *             - name: "Organized raw video files"
 *             - name: "Multicam recording files"
 *             - name: "High-quality audio files"
 * 
 *     Studio:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - imageUrl
 *         - totalSeats
 *         - openingTime
 *         - closingTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: Name of the studio
 *         location:
 *           type: string
 *           description: Studio location
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL to the studio's image
 *         totalSeats:
 *           type: integer
 *           minimum: 1
 *           description: Total number of seats available
 *         openingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example: "10:00"
 *           description: Studio opening time (24-hour format)
 *         closingTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example: "22:00"
 *           description: Studio closing time (24-hour format)
 *         isFullyBooked:
 *           type: boolean
 *           description: Whether the studio is fully booked for today
 *           example: false
 *         availableSlots:
 *           type: integer
 *           description: Number of available time slots today
 *           example: 8
 *         totalSlots:
 *           type: integer
 *           description: Total number of possible time slots today
 *           example: 13
 *         packages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StudioPackage'
 *           description: List of packages associated with the studio
 * 
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: string
 *           description: "Detailed error information (if available)"
 * 
 *     TimeSlot:
 *       type: object
 *       properties:
 *         start:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T10:00:00Z"
 *         end:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T10:00:00Z"
 *         available:
 *           type: boolean
 *           example: true
 *     
 *     DayAvailability:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2024-03-01T00:00:00.000Z"
 *         status:
 *           type: string
 *           enum: [available, partially-booked, fully-booked, past]
 *           example: "partially-booked"
 *         availableSlots:
 *           type: integer
 *           example: 5
 *         totalSlots:
 *           type: integer
 *           example: 8
 *         metadata:
 *           type: object
 *           properties:
 *             isWeekend:
 *               type: boolean
 *               example: false
 *             bookings:
 *               type: integer
 *               description: Number of bookings for this day
 *               example: 3
 * 
 * /studios:
 *   post:
 *     summary: Create a new studio
 *     description: |
 *       Creates a new studio and associates it with the default packages.
 *       Default packages are shared across all studios and include:
 *       1. "Recording (Video + Audio)" - Basic recording package with same-day delivery
 *       2. "Recording + Professional Edit" - Advanced package with professional editing
 *       
 *       Additional custom packages can be created specifically for this studio.
 *     tags: [Studios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - imageUrl
 *               - totalSeats
 *               - openingTime
 *               - closingTime
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the studio
 *               location:
 *                 type: string
 *                 description: Studio location
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to the studio's image
 *               totalSeats:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total number of seats available
 *               openingTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "10:00"
 *                 description: Studio opening time (24-hour format)
 *               closingTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "22:00"
 *                 description: Studio closing time (24-hour format)
 *               packages:
 *                 type: array
 *                 description: "Additional custom packages specific to this studio (optional)"
 *                 items:
 *                   $ref: '#/components/schemas/StudioPackage'
 *     responses:
 *       201:
 *         description: Studio created successfully with default and custom packages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Studio'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all studios
 *     tags: [Studios]
 *     responses:
 *       200:
 *         description: List of studios with their packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Studio'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /studios/{id}/availability:
 *   get:
 *     summary: Get studio availability for a specific date or month
 *     description: |
 *       Returns availability information for a studio. Supports two view modes:
 *       - month: Returns availability status for each day in the month
 *       - day: Returns detailed time slots for a specific date
 *       
 *       Status types for month view:
 *       - available: All slots are free
 *       - partially-booked: Some slots are booked
 *       - fully-booked: No slots available
 *       - past: Date is in the past
 *     tags: [Studios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Studio ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: "Date to check availability (YYYY-MM-DD format). For month view, any date in the target month."
 *       - in: query
 *         name: view
 *         required: false
 *         schema:
 *           type: string
 *           enum: [month, day]
 *           default: month
 *         description: View type - month returns full month availability, day returns hourly slots
 *     responses:
 *       200:
 *         description: Studio availability information
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Month view response
 *                   properties:
 *                     studioId:
 *                       type: string
 *                       format: uuid
 *                     month:
 *                       type: string
 *                       format: date-time
 *                     availability:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DayAvailability'
 *                 - type: object
 *                   description: Day view response
 *                   properties:
 *                     studioId:
 *                       type: string
 *                       format: uuid
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     timeSlots:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TimeSlot'
 *       404:
 *         description: Studio not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const router = Router();
const studioController = new StudioController();

router.post('/', validateCreateStudioRequest, studioController.createStudio);
router.get('/', studioController.getAllStudios);
router.get('/:id', studioController.getStudioById);
router.get('/:id/availability', studioController.getStudioAvailability);
router.get('/:id/packages', studioController.getStudioPackages);

export default router;

