import { Router } from 'express';
import multer from 'multer';
import { flexibleAuth, optionalApiKeyAuth, optionalSubdomainAuth, validate, postListSchema, postRetrieveSchema, postCreateSchema, postUpdateSchema, postChangeStatusSchema, postAddTagSchema } from '../../middlewares/index.js';
import { 
  listPosts, 
  retrievePost, 
  createPost,
  uploadPost,
  updatePost, 
  changePostStatus, 
  deletePost,
  addTagToPost,
  removeTagFromPost 
} from '../../controllers/index.js';

const router = Router();

// Configure multer for file uploads (memory storage for blob upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Apply subdomain middleware to all post routes
router.use(optionalSubdomainAuth);

// POST /posts/list - List posts (public)
router.post('/list', optionalApiKeyAuth, validate(postListSchema), listPosts);

// POST /posts/retrieve - Get a single post (public)
router.post('/retrieve', optionalApiKeyAuth, validate(postRetrieveSchema), retrievePost);

// POST /posts/create - Create a new post (public for guests)
router.post('/create', optionalApiKeyAuth, validate(postCreateSchema), createPost);

// POST /posts/upload - Create a new post with file uploads (multipart/form-data)
router.post('/upload', optionalApiKeyAuth, upload.array('files', 10), uploadPost);

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
