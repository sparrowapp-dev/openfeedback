import { Router } from 'express';
import { flexibleAuth, optionalApiKeyAuth, optionalSubdomainAuth, validate, boardListSchema, boardRetrieveSchema, boardCreateSchema } from '../../middlewares/index.js';
import { listBoards, retrieveBoard, createBoard, deleteBoard } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware to all board routes
router.use(optionalSubdomainAuth);

// POST /boards/list - List all boards (public or private based on auth)
// Use flexibleAuth to detect user if logged in
router.post('/list', flexibleAuth, validate(boardListSchema), listBoards);

// POST /boards/retrieve - Get a single board (public)
router.post('/retrieve', optionalApiKeyAuth, validate(boardRetrieveSchema), retrieveBoard);

// POST /boards/create - Create a new board (requires auth)
router.post('/create', flexibleAuth, validate(boardCreateSchema), createBoard);

// POST /boards/delete - Delete a board (requires auth)
router.post('/delete', flexibleAuth, validate(boardRetrieveSchema), deleteBoard);

export const boardsRoutes = router;
