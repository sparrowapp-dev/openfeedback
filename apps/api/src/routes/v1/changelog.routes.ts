import { Router } from 'express';
import { optionalSubdomainAuth, flexibleAuth, validate, changelogListSchema, changelogCreateSchema } from '../../middlewares/index.js';
import { listChangelog, retrieveChangelog, createChangelog, deleteChangelog } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware first
router.use(optionalSubdomainAuth);

// All changelog routes require authentication
router.use(flexibleAuth);

// POST /entries/list - List changelog entries
router.post('/list', validate(changelogListSchema), listChangelog);

// POST /entries/retrieve - Get a changelog entry by ID
router.post('/retrieve', retrieveChangelog);

// POST /entries/create - Create a changelog entry
router.post('/create', validate(changelogCreateSchema), createChangelog);

// POST /entries/delete - Delete a changelog entry
router.post('/delete', deleteChangelog);

export const changelogRoutes = router;
