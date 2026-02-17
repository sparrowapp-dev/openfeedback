import { Router } from 'express';
import { optionalSubdomainAuth, flexibleAuth, validate, voteCreateSchema, voteDeleteSchema, voteListSchema } from '../../middlewares/index.js';
import { createVote, retrieveVote, listVotes, deleteVote } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware to all vote routes
router.use(optionalSubdomainAuth);

// POST /votes/create - Create a vote (public for guest voting)
router.post('/create', flexibleAuth, validate(voteCreateSchema), createVote);

// POST /votes/list - List votes (public)
router.post('/list', flexibleAuth, validate(voteListSchema), listVotes);

// POST /votes/delete - Delete a vote (public for guest un-voting)
router.post('/delete', flexibleAuth, validate(voteDeleteSchema), deleteVote);

// POST /votes/retrieve - Get a vote by ID (requires auth)
router.post('/retrieve', flexibleAuth, retrieveVote);

export const votesRoutes = router;
