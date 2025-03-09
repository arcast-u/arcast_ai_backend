import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { validateCreateLeadRequest } from '../middleware/validation.middleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       required:
 *         - fullName
 *         - phoneNumber
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The lead ID
 *         fullName:
 *           type: string
 *           description: Full name of the lead
 *         email:
 *           type: string
 *           format: email
 *           description: "Email address (optional)"
 *         phoneNumber:
 *           type: string
 *           description: Phone number of the lead
 *         whatsappNumber:
 *           type: string
 *           description: "WhatsApp number (optional)"
 *         recordingLocation:
 *           type: string
 *           description: "Preferred recording location (optional)"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         bookings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 * 
 * /leads:
 *   get:
 *     summary: Get all leads
 *     description: |
 *       Retrieves a list of all leads with their basic information.
 *       Can be filtered by search query and sorted by creation date.
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter leads by name, email, or phone
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by creation date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of leads
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *                     currentPage:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Items per page
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 *   post:
 *     summary: Create a new lead
 *     description: |
 *       Creates a new lead in the system. If a lead with the same email already exists,
 *       their information will be updated instead of creating a duplicate entry.
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phoneNumber
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the lead
 *               email:
 *                 type: string
 *                 format: email
 *                 description: "Email address (optional)"
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the lead
 *               whatsappNumber:
 *                 type: string
 *                 description: "WhatsApp number (optional)"
 *               recordingLocation:
 *                 type: string
 *                 description: "Preferred recording location (optional)"
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Invalid request data
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
 * 
 * /leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     description: Retrieves detailed information about a specific lead, including their booking history
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The lead ID
 *     responses:
 *       200:
 *         description: Lead details with booking history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead not found
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
const leadController = new LeadController();

router.post('/', validateCreateLeadRequest, leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);

export default router; 