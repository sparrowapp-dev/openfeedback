import { Router } from 'express';
import { optionalSubdomainAuth, flexibleAuth, optionalApiKeyAuth, validate, commentCreateSchema, commentListSchema, commentDeleteSchema } from '../../middlewares/index.js';
import { createComment, retrieveComment, listComments, deleteComment } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware to all comment routes
router.use(optionalSubdomainAuth);

// POST /comments/create - Create a comment (public for guest commenting)
router.post('/create', optionalApiKeyAuth, validate(commentCreateSchema), createComment);

// POST /comments/list - List comments (public for viewing comments)
router.post('/list', optionalApiKeyAuth, validate(commentListSchema), listComments);

// POST /comments/retrieve - Get a comment by ID (authenticated)
router.post('/retrieve', flexibleAuth, retrieveComment);

// POST /comments/delete - Delete a comment (authenticated)
router.post('/delete', flexibleAuth, validate(commentDeleteSchema), deleteComment);

export const commentsRoutes = router;
