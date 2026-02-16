import { Router } from 'express';
import { boardsRoutes } from './v1/boards.routes.js';
import { usersRoutes } from './v1/users.routes.js';
import { postsRoutes } from './v1/posts.routes.js';
import { votesRoutes } from './v1/votes.routes.js';
import { commentsRoutes } from './v1/comments.routes.js';
import { categoriesRoutes } from './v1/categories.routes.js';
import { tagsRoutes } from './v1/tags.routes.js';
import { changelogRoutes } from './v1/changelog.routes.js';
import { companiesRoutes } from './v1/companies.routes.js';
import { authRoutes } from './v1/auth.routes.js';
import { userRoutes } from './v1/user.routes.js';
import { notFoundHandler } from '../middlewares/index.js';

export const apiRoutes = Router();

// Canny-compatible API endpoints
apiRoutes.use('/boards', boardsRoutes);
apiRoutes.use('/users', usersRoutes);
apiRoutes.use('/posts', postsRoutes);
apiRoutes.use('/votes', votesRoutes);
apiRoutes.use('/comments', commentsRoutes);
apiRoutes.use('/categories', categoriesRoutes);
apiRoutes.use('/tags', tagsRoutes);
apiRoutes.use('/entries', changelogRoutes); // Changelog uses /entries endpoint

// OpenFeedback-specific endpoints
apiRoutes.use('/companies', companiesRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/user', userRoutes);

// 404 handler for API routes
apiRoutes.use(notFoundHandler);
