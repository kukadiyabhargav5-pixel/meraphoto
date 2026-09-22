import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import apiRouter from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting to secure API against brute-force/DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit to allow large folder bulk uploads
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const frontendUrl = process.env.FRONTEND_URL;
    const clientUrl = process.env.CLIENT_URL;
    const isAllowed = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('10.') ||
      origin.includes('192.168.') ||
      origin.includes('172.') ||
      origin.endsWith('.vercel.app') || 
      (Boolean(frontendUrl) && origin === frontendUrl) ||
      (Boolean(clientUrl) && origin === clientUrl) ||
      origin.includes('techaarambh') ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', limiter);

// Register API Routes
app.use('/api', apiRouter);

// Global Health & Anti-Sleep Keep-Alive Check
const handleHealthCheck = async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.command({ ping: 1 });
      dbStatus = 'connected_active';
    }
  } catch (e: any) {
    dbStatus = 'error: ' + (e?.message || 'unknown');
  }

  res.json({
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

app.get('/health', handleHealthCheck);
app.get('/api/health', handleHealthCheck);

// Mock WhatsApp receiver for local testing redirection
app.post('/api/mock/whatsapp', (req: Request, res: Response) => {
  console.log('[MOCK WHATSAPP INBOUND]:', req.body);
  res.json({ success: true, message: 'Mock processed' });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

import { initializeQdrant } from './services/qdrantService';
import { startEventRetentionScheduler } from './services/eventRetentionService';

// Connect to MongoDB & Start Server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maraphoto';
console.log('Connecting to database...');
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB Database successfully.');
    await initializeQdrant();
    startEventRetentionScheduler();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err);
    process.exit(1);
  });

export default app;
