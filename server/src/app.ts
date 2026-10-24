import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import adminRoutes from './routes/admin.routes';
import topicRoutes from './routes/topic.routes';
import tagRoutes from './routes/tag.routes';

const app: Application = express();
const prisma = new PrismaClient();

// Security Headers
app.use(helmet());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply the rate limiting middleware to all requests
app.use('/api', globalLimiter);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or any localhost port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

// Body parser limits
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/tags', tagRoutes);

// Health API
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      api: 'ok',
      database: 'ok',
      message: 'API is running'
    });
  } catch (error) {
    console.error('Database health check failed', error);
    res.status(500).json({
      success: false,
      api: 'ok',
      database: 'error',
      message: 'Database connection failed'
    });
  }
});

// Basic Error Handler Stub
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.'
    }
  });
});

export default app;
