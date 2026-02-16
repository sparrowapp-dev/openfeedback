import { Router } from 'express';
import { flexibleAuth } from '../../middlewares/index.js';
import { createCompany, retrieveCompany, regenerateApiKey } from '../../controllers/index.js';

const router = Router();

// POST /companies/create - Create a new company (no auth required - setup endpoint)
router.post('/create', createCompany);

// POST /companies/retrieve - Get current company (requires auth)
router.post('/retrieve', flexibleAuth, retrieveCompany);

// POST /companies/regenerate_api_key - Regenerate API key (requires auth)
router.post('/regenerate_api_key', flexibleAuth, regenerateApiKey);

export const companiesRoutes = router;
