import { Router } from 'express';
import { flexibleAuth, optionalSubdomainAuth, validate, categoryListSchema, categoryCreateSchema } from '../../middlewares/index.js';
import { listCategories, retrieveCategory, createCategory, deleteCategory } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware first
router.use(optionalSubdomainAuth);

// All category routes require authentication
router.use(flexibleAuth);

// POST /categories/list - List categories for a board
router.post('/list', validate(categoryListSchema), listCategories);

// POST /categories/retrieve - Get a category by ID
router.post('/retrieve', retrieveCategory);

// POST /categories/create - Create a category
router.post('/create', validate(categoryCreateSchema), createCategory);

// POST /categories/delete - Delete a category
router.post('/delete', deleteCategory);

export const categoriesRoutes = router;
