import { Router } from 'express';
import multer from 'multer';
import { optionalSubdomainAuth, flexibleAuth, optionalApiKeyAuth, validate, commentCreateSchema, commentListSchema, commentDeleteSchema } from '../../middlewares/index.js';
import { createComment, uploadComment, retrieveComment, listComments, deleteComment } from '../../controllers/index.js';

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

// Apply subdomain middleware to all comment routes
router.use(optionalSubdomainAuth);

// POST /comments/create - Create a comment (public for guest commenting)
router.post('/create', optionalApiKeyAuth, validate(commentCreateSchema), createComment);

// POST /comments/upload - Create a comment with file uploads (multipart/form-data)
router.post('/upload', optionalApiKeyAuth, upload.array('files', 10), uploadComment);

// POST /comments/list - List comments (public for viewing comments)
router.post('/list', optionalApiKeyAuth, validate(commentListSchema), listComments);

// POST /comments/retrieve - Get a comment by ID (authenticated)
router.post('/retrieve', flexibleAuth, retrieveComment);

// POST /comments/delete - Delete a comment (authenticated)
router.post('/delete', flexibleAuth, validate(commentDeleteSchema), deleteComment);

export const commentsRoutes = router;
