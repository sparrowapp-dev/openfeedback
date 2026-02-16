import { Request, Response, NextFunction } from 'express';
import { Company, ICompanyDocument } from '../models/index.js';
import { AppError } from './error.middleware.js';

/**
 * Extend Express Request to include company
 */
declare global {
  namespace Express {
    interface Request {
      company?: ICompanyDocument;
    }
  }
}

/**
 * API Key authentication middleware
 * Extracts apiKey from request body or query, validates against Company collection
 * Returns Canny-compatible error format
 */
export async function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract apiKey from body or query (Canny accepts both)
    const apiKey = req.body?.apiKey || req.query?.apiKey;

    if (!apiKey) {
      throw new AppError('please provide your API key', 401);
    }

    if (typeof apiKey !== 'string') {
      throw new AppError('invalid api key format', 401);
    }

    // Find company by API key
    const company = await Company.findByApiKey(apiKey);

    if (!company) {
      throw new AppError('invalid api key', 401);
    }

    // Attach company to request
    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional API key auth - sets company if apiKey provided, continues without if not
 * Useful for public endpoints that have different behavior based on auth
 */
export async function optionalApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.body?.apiKey || req.query?.apiKey;

    if (apiKey && typeof apiKey === 'string') {
      const company = await Company.findByApiKey(apiKey);
      if (company) {
        req.company = company;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Flexible auth middleware - accepts either API key (for 3rd party) or JWT token (for authenticated users)
 * Attaches company to request if authentication succeeds
 */
export async function flexibleAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { verifyToken } = await import('../services/auth.service.js');
      try {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        
        // Find company from token
        const company = await Company.findById(payload.companyId);
        if (company) {
          req.company = company;
          (req as any).userId = payload.userId;
          (req as any).isAdmin = payload.isAdmin;
          return next();
        }
      } catch (error) {
        // JWT validation failed, try API key
      }
    }

    // Try API key
    const apiKey = req.body?.apiKey || req.query?.apiKey;
    if (apiKey && typeof apiKey === 'string') {
      const company = await Company.findByApiKey(apiKey);
      if (company) {
        req.company = company;
        return next();
      }
    }

    // No valid authentication found
    throw new AppError('authentication required: provide either API key or Bearer token', 401);
  } catch (error) {
    next(error);
  }
}
