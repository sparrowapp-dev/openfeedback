import { Router } from 'express';
import { flexibleAuth, optionalApiKeyAuth, validate, postListSchema, postRetrieveSchema, postCreateSchema, postUpdateSchema, postChangeStatusSchema, postAddTagSchema } from '../../middlewares/index.js';
import { 
  listPosts, 
  retrievePost, 
  createPost, 
  updatePost, 
  changePostStatus, 
  deletePost,
  addTagToPost,
  removeTagFromPost 
} from '../../controllers/index.js';

const router = Router();

// POST /posts/list - List posts (public)
router.post('/list', optionalApiKeyAuth, validate(postListSchema), listPosts);

// POST /posts/retrieve - Get a single post (public)
router.post('/retrieve', optionalApiKeyAuth, validate(postRetrieveSchema), retrievePost);

// POST /posts/create - Create a new post (public for guests)
router.post('/create', optionalApiKeyAuth, validate(postCreateSchema), createPost);

// POST /posts/update - Update a post (requires auth)
router.post('/update', flexibleAuth, validate(postUpdateSchema), updatePost);

// POST /posts/change_status - Change post status (requires auth)
router.post('/change_status', flexibleAuth, validate(postChangeStatusSchema), changePostStatus);

// POST /posts/delete - Delete a post (requires auth)
router.post('/delete', flexibleAuth, validate(postRetrieveSchema), deletePost);

// POST /posts/add_tag - Add a tag to a post (requires auth)
router.post('/add_tag', flexibleAuth, validate(postAddTagSchema), addTagToPost);

// POST /posts/remove_tag - Remove a tag from a post
router.post('/remove_tag', validate(postAddTagSchema), removeTagFromPost);

export const postsRoutes = router;
