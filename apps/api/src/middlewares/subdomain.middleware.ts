import { Request, Response, NextFunction } from 'express';
import { Company, ICompanyDocument } from '../models/index.js';
import { AppError } from './error.middleware.js';

/**
 * Extract subdomain from Host header and attach company to request
 * 
 * Supports:
 * - subdomain.domain.com -> subdomain
 * - localhost:3000 -> uses 'demo' as fallback
 * - IP addresses -> uses 'demo' as fallback
 */
export async function subdomainAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const host = req.get('host') || req.hostname;
    let subdomain = 'demo'; // default fallback

    // Extract subdomain from host
    if (host && !host.startsWith('localhost') && !host.match(/^\d+\.\d+\.\d+\.\d+/)) {
      const parts = host.split('.');
      if (parts.length >= 3) {
        // subdomain.domain.com -> subdomain
        subdomain = parts[0];
      }
    }

    // Check if subdomain is provided in body or query (for local dev/testing)
    const requestSubdomain = req.body?.subdomain || req.query?.subdomain;
    if (requestSubdomain && typeof requestSubdomain === 'string') {
      subdomain = requestSubdomain;
    }

    // Find company by subdomain
    const company = await Company.findOne({ subdomain });

    if (!company) {
      throw new AppError(`company not found for subdomain: ${subdomain}`, 404);
    }

    req.company = company;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional subdomain auth - sets company if found, continues without throwing error
 */
export async function optionalSubdomainAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const host = req.get('host') || req.hostname;
    let subdomain = 'demo';

    if (host && !host.startsWith('localhost') && !host.match(/^\d+\.\d+\.\d+\.\d+/)) {
      const parts = host.split('.');
      if (parts.length >= 3) {
        subdomain = parts[0];
      }
    }

    const requestSubdomain = req.body?.subdomain || req.query?.subdomain;
    if (requestSubdomain && typeof requestSubdomain === 'string') {
      subdomain = requestSubdomain;
    }

    const company = await Company.findOne({ subdomain });
    if (company) {
      req.company = company;
    }

    next();
  } catch (error) {
    next(error);
  }
}
