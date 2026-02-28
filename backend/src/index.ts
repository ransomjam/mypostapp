import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import generateRoutes from './routes/generate';
import adaptRoutes from './routes/adapt';
import analyseRoutes from './routes/analyse';
import scoreRoutes from './routes/score';
import riskRoutes from './routes/risk';
import imageRoutes from './routes/image';
import contextRoutes from './routes/context';
import adminRoutes from './routes/admin';
import planRoutes from './routes/plan';

// Validate config on startup
validateConfig();

const app = express();

// Security
app.use(helmet());
app.use(cors({
    origin: config.cors.frontendUrl.includes(',')
        ? config.cors.frontendUrl.split(',').map(url => url.trim())
        : config.cors.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/adapt', adaptRoutes);
app.use('/api/analyse', analyseRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/context', contextRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
    logger.info(`🚀 mypostapp API running on port ${config.port}`);
    logger.info(`📝 Environment: ${config.env}`);
    logger.info(`🔗 Frontend URL: ${config.cors.frontendUrl}`);
});

export default app;
