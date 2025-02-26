import prisma from '../config/db.config.js';
import { ValidationError } from '../errors/custom.errors.js';
import { createNotionLeadEntry } from '../utils/notion.utils.js';

export class LeadController {
  /**
   * Get all leads with pagination and search
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getLeads = async (req, res) => {
    try {
      const {
        search = '',
        sort = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build search conditions
      const where = search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search } }
            ]
          }
        : {};

      // Get total count for pagination
      const total = await prisma.lead.count({ where });

      // Get leads with pagination
      const leads = await prisma.lead.findMany({
        where,
        orderBy: {
          createdAt: sort
        },
        skip,
        take: Number(limit),
        include: {
          bookings: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true
            },
            orderBy: {
              startTime: 'desc'
            },
            take: 5 // Only get the 5 most recent bookings
          }
        }
      });

      // Calculate pagination info
      const pages = Math.ceil(total / Number(limit));

      res.json({
        data: leads,
        pagination: {
          total,
          pages,
          currentPage: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching leads'
      });
    }
  }

  /**
   * Get lead by ID with booking history
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  getLeadById = async (req, res) => {
    const { id } = req.params;

    try {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          bookings: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              totalCost: true,
              studio: {
                select: {
                  name: true,
                  location: true
                }
              },
              package: {
                select: {
                  name: true,
                  price_per_hour: true
                }
              }
            },
            orderBy: {
              startTime: 'desc'
            }
          }
        }
      });

      if (!lead) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Lead not found'
        });
      }

      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching the lead'
      });
    }
  }

  /**
   * Create a new lead or update existing lead
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  createLead = async (req, res) => {
    const {
      fullName,
      email,
      phoneNumber,
      whatsappNumber,
      recordingLocation
    } = req.body;

    try {
      // Check for existing lead with the same email
      const existingLead = await prisma.lead.findFirst({
        where: { email }
      });

      let lead;
      if (existingLead) {
        // Update existing lead
        lead = await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            fullName,
            phoneNumber,
            ...(whatsappNumber && { whatsappNumber }),
            ...(recordingLocation && { recordingLocation })
          }
        });
      } else {
        // Create new lead
        lead = await prisma.lead.create({
          data: {
            fullName,
            email,
            phoneNumber,
            ...(whatsappNumber && { whatsappNumber }),
            ...(recordingLocation && { recordingLocation })
          }
        });
      }

      // Create Notion entry for the lead
      try {
        await createNotionLeadEntry(lead);
      } catch (notionError) {
        console.error('Failed to create Notion entry for lead:', notionError);
        // Don't fail the request if Notion integration fails
      }

      res.status(201).json(lead);
    } catch (error) {
      console.error('Lead creation error:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      });
    }
  }
} 