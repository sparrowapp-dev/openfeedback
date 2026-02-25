import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { config } from './config/index.js';
import { configurePassport } from './config/passport.config.js';
import { setupSwagger } from './config/swagger.config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiRoutes } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:1420', 'tauri://localhost'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize Passport
  configurePassport();
  app.use(passport.initialize());

  // Setup Swagger documentation
  setupSwagger(app);

  // Rate limiting
  // const limiter = rateLimit({
  //   windowMs: config.rateLimitWindowMs,
  //   max: config.rateLimitMaxRequests,
  //   message: { error: 'Too many requests, please try again later.' },
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // });
  // app.use('/api/', limiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes - v1 endpoints
  app.use('/api/v1', apiRoutes);

  // Error handler
  app.use(errorHandler);

  return app;
}
