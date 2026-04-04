import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { healthService } from '../services/health.service.js';

const router = Router();

router.get('/health', asyncHandler(async (_req, res) => {
  const { db } = await healthService.checkDatabase();
  const statusCode = db === 'connected' ? 200 : 503;
  res.status(statusCode).json({
    status: db === 'connected' ? 'ok' : 'degraded',
    db,
    uptime: process.uptime(),
  });
}));

export { router as healthRouter };
