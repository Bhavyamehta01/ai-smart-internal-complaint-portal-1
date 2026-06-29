import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/apiRouter';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting to all requests under /api
app.use('/api', apiLimiter);

// Master Routes Mounting
app.use('/api', apiRouter);

// Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    message: 'Smart Internal Complaint Portal API is active',
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Welcome to the Complaint Portal Backend Service API.');
});

// Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[Server]: Server is running in ${process.env.NODE_ENV} mode at http://localhost:${PORT}`);
});
