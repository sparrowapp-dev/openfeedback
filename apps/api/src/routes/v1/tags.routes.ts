import { Router } from 'express';
import { optionalSubdomainAuth, flexibleAuth, validate, tagListSchema, tagCreateSchema } from '../../middlewares/index.js';
import { listTags, retrieveTag, createTag, deleteTag } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware first
router.use(optionalSubdomainAuth);

// All tag routes require authentication
router.use(flexibleAuth);

// POST /tags/list - List tags for a board
router.post('/list', validate(tagListSchema), listTags);

// POST /tags/retrieve - Get a tag by ID
router.post('/retrieve', retrieveTag);

// POST /tags/create - Create a tag
router.post('/create', validate(tagCreateSchema), createTag);

// POST /tags/delete - Delete a tag
router.post('/delete', deleteTag);

export const tagsRoutes = router;
