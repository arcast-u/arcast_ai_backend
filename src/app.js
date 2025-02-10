import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from 'swagger-ui-express';
import { specs } from './docs/swagger.js';

import studioRoutes from './routes/studio.routes.js';
import bookingRoutes from './routes/booking.routes.js';

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { customCssUrl: CSS_URL }));

app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);

export default app;

