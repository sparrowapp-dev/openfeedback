import { Request, Response } from 'express';
import { Company } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';

/**
 * POST /companies/create
 * Create a new company (admin/setup endpoint)
 * This is NOT part of the Canny API - it's for initial setup
 */
export const createCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, domainWhitelist, subdomain } = req.body;

  // Generate API key
  const { plain: apiKeyPlain, hash: apiKeyHash } = Company.generateApiKey();

  // Create company
  const company = await Company.create({
    name,
    apiKey: apiKeyPlain,
    apiKeyHash,
    domainWhitelist: domainWhitelist || [],
    subdomain,
  });

  // Return company with plain API key (only time it's visible)
  res.json({
    id: company._id.toString(),
    name: company.name,
    apiKey: apiKeyPlain, // Only returned on creation!
    domainWhitelist: company.domainWhitelist,
    subdomain: company.subdomain,
    created: company.created.toISOString(),
  });
});

/**
 * POST /companies/retrieve
 * Get current company info (based on API key)
 */
export const retrieveCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const company = req.company!;

  res.json({
    id: company._id.toString(),
    name: company.name,
    domainWhitelist: company.domainWhitelist,
    subdomain: company.subdomain,
    plan: company.plan,
    logoURL: company.logoURL,
    created: company.created.toISOString(),
  });
});

/**
 * POST /companies/regenerate_api_key
 * Regenerate API key for current company
 */
export const regenerateApiKey = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const company = req.company!;

  // Generate new API key
  const { plain: apiKeyPlain, hash: apiKeyHash } = Company.generateApiKey();

  // Update company
  company.apiKey = apiKeyPlain;
  company.apiKeyHash = apiKeyHash;
  await company.save();

  res.json({
    id: company._id.toString(),
    apiKey: apiKeyPlain,
    message: 'API key regenerated successfully. Save this key - it will not be shown again.',
  });
});
