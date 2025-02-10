import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ARcast Booking API',
      version: '1.0.0',
      description: 'API documentation for the Studio Booking System',
      contact: {
        name: 'API Support',
        email: 'support@studiobooking.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Studio: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            location: { type: 'string' },
            imageUrl: { type: 'string' },
            totalSeats: { type: 'integer' },
            openingTime: { type: 'string', format: 'HH:mm' },
            closingTime: { type: 'string', format: 'HH:mm' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            numberOfSeats: { type: 'integer' },
            totalCost: { type: 'number' },
            vatAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            status: { 
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
            }
          }
        },
        DiscountCode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['PERCENTAGE', 'FIXED_AMOUNT']
            },
            value: { type: 'number' },
            maxUses: { type: 'integer' },
            usedCount: { type: 'integer' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            minAmount: { type: 'number' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

export const specs = swaggerJsdoc(options); 