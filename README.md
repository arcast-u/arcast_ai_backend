# Arcast AI Backend

A Node.js/Express.js backend service for managing studio bookings and scheduling.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Documentation**: Swagger/OpenAPI
- **External Integration**: Notion API
- **Development**: Nodemon for hot reloading

## 📁 Project Structure

```
src/
├── config/         # Configuration files and constants
├── controllers/    # Request handlers and business logic
├── docs/          # API documentation (Swagger)
├── errors/        # Custom error definitions
├── middleware/    # Express middleware (validation, auth, etc.)
├── routes/        # API route definitions
├── utils/         # Utility functions and helpers
├── app.js         # Express application setup
└── server.js      # Server initialization
```

## 🛠️ Setup and Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd arcast_ai_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in required environment variables:
     - Database connection string
     - Notion API credentials
     - Port settings
     - Other configuration variables

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # (Optional) Seed the database
   npm run prisma:seed
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🚦 Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with hot reloading
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio
- `npm run prisma:seed`: Seed the database
- `npm run setup`: Complete setup (install, generate, migrate)

## 📚 API Documentation

API documentation is available through Swagger UI at `/api-docs` when the server is running.

### Main Endpoints:

- `/api/studios`: Studio management endpoints
- `/api/bookings`: Booking management endpoints

## 🔐 Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL database connection string
- `NOTION_API_KEY`: Notion API key
- `PORT`: Server port (default: 3000)
- Additional configuration variables as needed

## 🧪 Testing

(Add testing instructions when implemented)

## 📦 Deployment

1. Ensure all environment variables are properly set
2. Run database migrations
3. Start the server using `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Initial work - [Author Name]

## 🙏 Acknowledgments

- List any acknowledgments or third-party services used

## Discount Codes

To create the "ARCAST50" discount code that gives 50% off for first-time clients:

1. Apply the database migration to add the `firstTimeOnly` field to the `DiscountCode` model:

```bash
npx prisma migrate dev --name add_first_time_only_field
```

2. Run the script to create the ARCAST50 discount code:

```bash
npm run create:arcast50
```

This will create a discount code with the following properties:

- Code: `ARCAST50`
- Discount: 50% off
- Restrictions: Only valid for first-time clients
- Validity: 1 year from creation date

## Discount Code API Endpoints

The following endpoints are available for managing discount codes:

- `POST /api/discount-codes` - Create a new discount code
- `GET /api/discount-codes` - Get all discount codes
- `GET /api/discount-codes/:id` - Get a specific discount code by ID
- `PUT /api/discount-codes/:id` - Update an existing discount code
- `DELETE /api/discount-codes/:id` - Delete a discount code

Discount codes can be configured with the following options:

- Percentage or fixed amount discounts
- Minimum booking amount requirements
- Usage limits
- Active time period
- First-time client restriction 