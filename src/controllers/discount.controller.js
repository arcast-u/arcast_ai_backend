import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../errors/custom.errors.js';

const prisma = new PrismaClient();

/**
 * Create a new discount code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createDiscountCode = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      maxUses,
      startDate,
      endDate,
      isActive,
      minAmount,
      firstTimeOnly // New parameter to indicate if the code is for first-time clients only
    } = req.body;

    // Validate discount code format
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new ValidationError('Invalid discount code format');
    }

    // Check if code already exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { code }
    });

    if (existingCode) {
      throw new ValidationError('Discount code already exists');
    }

    // Create the discount code
    const discountCode = await prisma.discountCode.create({
      data: {
        code,
        type: type || 'PERCENTAGE', // Default to percentage if not provided
        value: value || 0,
        maxUses: maxUses || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year
        isActive: isActive !== undefined ? isActive : true,
        minAmount: minAmount || null,
        firstTimeOnly: firstTimeOnly || false // Store if this is for first-time clients only
      }
    });

    res.status(201).json({
      success: true,
      data: discountCode,
      message: 'Discount code created successfully'
    });
  } catch (error) {
    console.error('Error creating discount code:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create discount code'
    });
  }
};

/**
 * Get all discount codes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllDiscountCodes = async (req, res) => {
  try {
    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: discountCodes
    });
  } catch (error) {
    console.error('Error getting discount codes:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get discount codes'
    });
  }
};

/**
 * Get a discount code by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDiscountCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const discountCode = await prisma.discountCode.findUnique({
      where: { id }
    });

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        error: 'Discount code not found'
      });
    }

    res.status(200).json({
      success: true,
      data: discountCode
    });
  } catch (error) {
    console.error('Error getting discount code:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get discount code'
    });
  }
};

/**
 * Update a discount code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      type,
      value,
      maxUses,
      startDate,
      endDate,
      isActive,
      minAmount,
      firstTimeOnly
    } = req.body;

    // Check if discount code exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { id }
    });

    if (!existingCode) {
      return res.status(404).json({
        success: false,
        error: 'Discount code not found'
      });
    }

    // If code is changed, check if new code already exists
    if (code && code !== existingCode.code) {
      const codeExists = await prisma.discountCode.findUnique({
        where: { code }
      });

      if (codeExists) {
        throw new ValidationError('Discount code already exists');
      }
    }

    // Update discount code
    const updatedDiscountCode = await prisma.discountCode.update({
      where: { id },
      data: {
        code: code || existingCode.code,
        type: type || existingCode.type,
        value: value !== undefined ? value : existingCode.value,
        maxUses: maxUses !== undefined ? maxUses : existingCode.maxUses,
        startDate: startDate ? new Date(startDate) : existingCode.startDate,
        endDate: endDate ? new Date(endDate) : existingCode.endDate,
        isActive: isActive !== undefined ? isActive : existingCode.isActive,
        minAmount: minAmount !== undefined ? minAmount : existingCode.minAmount,
        firstTimeOnly: firstTimeOnly !== undefined ? firstTimeOnly : existingCode.firstTimeOnly
      }
    });

    res.status(200).json({
      success: true,
      data: updatedDiscountCode,
      message: 'Discount code updated successfully'
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update discount code'
    });
  }
};

/**
 * Delete a discount code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if discount code exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { id }
    });

    if (!existingCode) {
      return res.status(404).json({
        success: false,
        error: 'Discount code not found'
      });
    }

    // Check if discount code is used in any bookings
    const bookingsWithCode = await prisma.booking.count({
      where: {
        discountCodeId: id
      }
    });

    if (bookingsWithCode > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete discount code as it is used in bookings'
      });
    }

    // Delete discount code
    await prisma.discountCode.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Discount code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete discount code'
    });
  }
}; 