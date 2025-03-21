import express from 'express';
import * as discountController from '../controllers/discount.controller.js';

const router = express.Router();

/**
 * @swagger
 * /discount-codes:
 *   post:
 *     tags: [Discount Codes]
 *     summary: Create a new discount code
 *     description: |
 *       Creates a new discount code for use in bookings.
 *       Discount codes can be percentage-based or fixed amount discounts.
 *       You can also set them to be first-time-only codes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *                 description: The discount code to be used (e.g., "ARCAST50")
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Type of discount (percentage or fixed amount)
 *               value:
 *                 type: number
 *                 description: Value of the discount (percentage or fixed amount)
 *               maxUses:
 *                 type: integer
 *                 description: Maximum number of times this code can be used
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the discount code becomes valid
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the discount code expires
 *               isActive:
 *                 type: boolean
 *                 description: Whether the discount code is active
 *               minAmount:
 *                 type: number
 *                 description: Minimum booking amount required to use this code
 *               firstTimeOnly:
 *                 type: boolean
 *                 description: Whether this code is only applicable for first-time clients
 *     responses:
 *       201:
 *         description: Discount code created successfully
 *       400:
 *         description: Invalid request data or code already exists
 *       500:
 *         description: Server error
 */
router.post('/', discountController.createDiscountCode);

/**
 * @swagger
 * /discount-codes:
 *   get:
 *     tags: [Discount Codes]
 *     summary: Get all discount codes
 *     description: Retrieves a list of all discount codes
 *     responses:
 *       200:
 *         description: List of discount codes
 *       500:
 *         description: Server error
 */
router.get('/', discountController.getAllDiscountCodes);

/**
 * @swagger
 * /discount-codes/{id}:
 *   get:
 *     tags: [Discount Codes]
 *     summary: Get a discount code by ID
 *     description: Retrieves details of a specific discount code
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the discount code to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount code details
 *       404:
 *         description: Discount code not found
 *       500:
 *         description: Server error
 */
router.get('/:id', discountController.getDiscountCodeById);

/**
 * @swagger
 * /discount-codes/{id}:
 *   put:
 *     tags: [Discount Codes]
 *     summary: Update a discount code
 *     description: Updates an existing discount code
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the discount code to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: The discount code
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Type of discount
 *               value:
 *                 type: number
 *                 description: Value of the discount
 *               maxUses:
 *                 type: integer
 *                 description: Maximum number of times this code can be used
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the discount code becomes valid
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the discount code expires
 *               isActive:
 *                 type: boolean
 *                 description: Whether the discount code is active
 *               minAmount:
 *                 type: number
 *                 description: Minimum booking amount required
 *               firstTimeOnly:
 *                 type: boolean
 *                 description: Whether this code is only for first-time clients
 *     responses:
 *       200:
 *         description: Discount code updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Discount code not found
 *       500:
 *         description: Server error
 */
router.put('/:id', discountController.updateDiscountCode);

/**
 * @swagger
 * /api/discount-codes/{id}:
 *   delete:
 *     tags: [Discount Codes]
 *     summary: Delete a discount code
 *     description: Deletes a discount code if it's not used in any bookings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the discount code to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discount code deleted successfully
 *       400:
 *         description: Cannot delete as it's used in bookings
 *       404:
 *         description: Discount code not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', discountController.deleteDiscountCode);

export default router; 