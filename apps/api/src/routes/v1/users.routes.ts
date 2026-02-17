import { Router } from 'express';
import { optionalSubdomainAuth, flexibleAuth, optionalApiKeyAuth, validate, userCreateOrUpdateSchema, userRetrieveSchema, userDeleteSchema } from '../../middlewares/index.js';
import { createOrUpdateUser, retrieveUser, listUsers, deleteUser } from '../../controllers/index.js';

const router = Router();

// Apply subdomain middleware to all user routes
router.use(optionalSubdomainAuth);

// POST /users/create_or_update - Create or update a user (public for guest users)
router.post('/create_or_update', optionalApiKeyAuth, validate(userCreateOrUpdateSchema), createOrUpdateUser);

// POST /users/retrieve - Get a user by id, userID, or email (requires auth)
router.post('/retrieve', flexibleAuth, validate(userRetrieveSchema), retrieveUser);

// POST /users/list - List users (requires auth)
router.post('/list', flexibleAuth, listUsers);

// POST /users/delete - Delete a user (requires auth)
router.post('/delete', flexibleAuth, validate(userDeleteSchema), deleteUser);

export const usersRoutes = router;
