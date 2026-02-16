import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Company } from '../../models/index.js';
import { asyncHandler, AppError } from '../../middlewares/index.js';
import { verifyToken } from '../../services/auth.service.js';

const router = Router();

/**
 * JWT authentication middleware
 */
async function jwtAuth(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('authentication token required', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    // Attach user info to request
    (req as any).userId = payload.userId;
    (req as any).companyId = payload.companyId;
    
    next();
  } catch (error) {
    next(new AppError('invalid or expired token', 401));
  }
}

/**
 * POST /user/regenerate_api_key
 * Regenerate API key for authenticated user's company (admin only)
 */
router.post(
  '/regenerate_api_key',
  jwtAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).userId;
    const companyId = (req as any).companyId;

    if (!companyId) {
      throw new AppError('company ID not found in token', 400);
    }

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError('company not found', 404);
    }

    // Generate new API key
    const { plain: apiKeyPlain, hash: apiKeyHash } = Company.generateApiKey();

    // Update company
    company.apiKey = apiKeyPlain;
    company.apiKeyHash = apiKeyHash;
    await company.save();

    res.json({
      apiKey: apiKeyPlain,
      message: 'API key regenerated successfully',
    });
  })
);

/**
 * GET /user/api_key
 * Get current API key for authenticated user's company
 */
router.get(
  '/api_key',
  jwtAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const companyId = (req as any).companyId;

    if (!companyId) {
      throw new AppError('company ID not found in token', 400);
    }

    // Find company with API key
    const company = await Company.findById(companyId).select('+apiKey');
    if (!company) {
      throw new AppError('company not found', 404);
    }

    res.json({
      apiKey: company.apiKey,
    });
  })
);

export const userRoutes = router;
