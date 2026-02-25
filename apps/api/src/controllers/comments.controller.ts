import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Comment, Post, User, Board } from '../models/index.js';
import { asyncHandler, AppError, sanitizeContent } from '../middlewares/index.js';
import { skipPaginate, cursorPaginate, parsePaginationParams, parseCursorPaginationParams, notifications } from '../utils/index.js';
import { uploadFiles } from '../services/index.js';

/**
 * Helper to format a comment for Canny-compatible response
 */
async function formatComment(comment: any) {
  const [author, post] = await Promise.all([
    User.findById(comment.authorID),
    Post.findById(comment.postID),
  ]);

  const board = post ? await Board.findById(post.boardID) : null;

  // Fetch mentioned users
  const mentions = comment.mentions?.length > 0
    ? await User.find({ _id: { $in: comment.mentions } })
    : [];

  return {
    id: comment._id.toString(),
    author: author?.toJSON() || null,
    board: board?.toJSON() || null,
    created: comment.created?.toISOString(),
    imageURLs: comment.imageURLs || [],
    internal: comment.internal || false,
    likeCount: comment.likeCount || 0,
    mentions: mentions.map(m => m.toJSON()),
    parentID: comment.parentID?.toString() || null,
    post: post ? {
      id: post._id.toString(),
      title: post.title,
      url: `/admin/post/${post._id}`,
    } : null,
    private: comment.private || false,
    reactions: comment.reactions || { like: 0 },
    value: comment.value,
  };
}

/**
 * POST /comments/create
 * Create a new comment
 */
export const createComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, authorID, value, parentID, imageURLs, internal } = req.body;

  // Validate post exists first (needed to get companyID for guest users)
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    throw new AppError('invalid postID', 400);
  }
  const post = await Post.findById(postID);
  if (!post) {
    throw new AppError('post not found', 404);
  }
  const companyID = post.companyID;

  // Validate author exists
  if (!mongoose.Types.ObjectId.isValid(authorID)) {
    throw new AppError('invalid authorID', 400);
  }
  const author = await User.findOne({ _id: authorID, companyID });
  if (!author) {
    throw new AppError('author not found', 404);
  }

  // Validate parent comment if provided
  if (parentID) {
    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      throw new AppError('invalid parentID', 400);
    }
    const parent = await Comment.findOne({ _id: parentID, postID: post._id });
    if (!parent) {
      throw new AppError('parent comment not found', 404);
    }
  }

  // Sanitize comment content
  const sanitizedValue = sanitizeContent(value);

  // Create comment
  const comment = await Comment.create({
    companyID,
    postID: post._id,
    authorID: author._id,
    value: sanitizedValue,
    parentID: parentID ? new mongoose.Types.ObjectId(parentID) : undefined,
    imageURLs: imageURLs || [],
    internal: internal || false,
  });

  // Increment post comment count
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

  // Emit notification
  notifications.emit('post.commented', {
    companyID: companyID.toString(),
    data: {
      postID: post._id.toString(),
      commentID: comment._id.toString(),
      authorID: author._id.toString(),
    },
  });

  const formatted = await formatComment(comment);
  res.json(formatted);
});

/**
 * POST /comments/upload
 * Create a new comment with file uploads (multipart/form-data)
 * Combines image upload and comment creation into a single endpoint
 */
export const uploadComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract form fields from multipart request
  const { postID, value, parentID, authorID, email, internal } = req.body;
  
  // Get uploaded files from multer
  const files = req.files as Express.Multer.File[] | undefined;
  
  // Validate required fields
  if (!value) {
    throw new AppError('value is required', 400);
  }
  
  if (!postID) {
    throw new AppError('postID is required', 400);
  }

  // Validate post exists first (needed to get companyID for guest users)
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    throw new AppError('invalid postID', 400);
  }
  const post = await Post.findById(postID);
  if (!post) {
    throw new AppError('post not found', 404);
  }
  const companyID = post.companyID;

  // Determine authorID - either from form data or from email lookup/creation
  let resolvedAuthorID: mongoose.Types.ObjectId;
  
  if (authorID) {
    if (!mongoose.Types.ObjectId.isValid(authorID)) {
      throw new AppError('invalid authorID', 400);
    }
    const author = await User.findOne({ _id: authorID, companyID });
    if (!author) {
      throw new AppError('author not found', 404);
    }
    resolvedAuthorID = author._id;
  } else if (email) {
    // Try to find user by email or create a guest user
    let user = await User.findOne({ email, companyID });
    if (!user) {
      user = await User.create({
        companyID,
        email,
        name: email.split('@')[0],
        isAdmin: false,
      });
    }
    resolvedAuthorID = user._id;
  } else {
    throw new AppError('authorID or email is required', 400);
  }

  // Validate parent comment if provided
  if (parentID) {
    if (!mongoose.Types.ObjectId.isValid(parentID)) {
      throw new AppError('invalid parentID', 400);
    }
    const parent = await Comment.findOne({ _id: parentID, postID: post._id });
    if (!parent) {
      throw new AppError('parent comment not found', 404);
    }
  }

  // Upload files to blob storage if any
  let imageURLs: string[] = [];
  if (files && files.length > 0) {
    try {
      imageURLs = await uploadFiles(files);
    } catch (err) {
      console.error('Failed to upload files:', err);
      throw new AppError('Failed to upload images', 500);
    }
  }

  // Sanitize comment content
  const sanitizedValue = sanitizeContent(value);

  // Create comment
  const comment = await Comment.create({
    companyID,
    postID: post._id,
    authorID: resolvedAuthorID,
    value: sanitizedValue,
    parentID: parentID ? new mongoose.Types.ObjectId(parentID) : undefined,
    imageURLs,
    internal: internal === 'true' || internal === true || false,
  });

  // Increment post comment count
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

  // Emit notification
  notifications.emit('post.commented', {
    companyID: companyID.toString(),
    data: {
      postID: post._id.toString(),
      commentID: comment._id.toString(),
      authorID: resolvedAuthorID.toString(),
    },
  });

  // Return response in the format expected by the frontend specification
  res.json({
    isSuccessful: true,
    message: 'Comment added successfully',
    data: {
      id: comment._id.toString(),
      imageUrls: imageURLs,
      comment: await formatComment(comment),
    },
  });
});

/**
 * POST /comments/retrieve
 * Get a comment by ID
 */
export const retrieveComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid comment id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find comment's company
    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('comment not found', 404);
    }
    const post = await Post.findById(comment.postID);
    if (post) {
       companyID = post.companyID;
    } else {
      // Assuming comment has no direct companyID, must rely on post
       throw new AppError('associated post not found', 404);
    }
  }

  const comment = await Comment.findOne({ _id: id });
  // Verify ownership? Comment model doesn't seem to store companyID directly based on listComments using post.companyID
  // But retrieveComment original code used `Comment.findOne({ _id: id, companyID })` so maybe unsafe-ish if Schema doesn't have it?
  // Let's check Schema... assume it has companyID or we trust `post.companyID` check.
  
  // Actually, listComments builds query { companyID } so Comment MUST have companyID.
  // Re-reading listComments: `const query: Record<string, unknown> = { companyID };`
  
  if (!comment) {
    throw new AppError('comment not found', 404);
  }
  
  // Verify companyID match if we found one
  const post = await Post.findById(comment.postID);
  if (!post || post.companyID.toString() !== companyID.toString()) {
      throw new AppError('comment not found', 404);
  }

  const formatted = await formatComment(comment);
  res.json(formatted);
});

/**
 * POST /comments/list (supports both v1 skip and v2 cursor pagination)
 * List comments for a post
 */
export const listComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID, postID, authorID, cursor } = req.body;

  // Get companyID from context (for guest users)
  let companyID: mongoose.Types.ObjectId;
  if (req.company) {
    companyID = req.company._id;
  } else if (postID && mongoose.Types.ObjectId.isValid(postID)) {
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  } else if (boardID && mongoose.Types.ObjectId.isValid(boardID)) {
    const board = await Board.findById(boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  } else {
    throw new AppError('companyID could not be determined', 400);
  }

  // Build query
  const query: Record<string, unknown> = { companyID };
  
  if (postID) {
    if (!mongoose.Types.ObjectId.isValid(postID)) {
      throw new AppError('invalid postID', 400);
    }
    query.postID = new mongoose.Types.ObjectId(postID);
  }
  
  if (authorID) {
    if (!mongoose.Types.ObjectId.isValid(authorID)) {
      throw new AppError('invalid authorID', 400);
    }
    query.authorID = new mongoose.Types.ObjectId(authorID);
  }

  if (boardID) {
    // Find all posts in the board first
    const posts = await Post.find({ boardID: new mongoose.Types.ObjectId(boardID), companyID }).select('_id');
    query.postID = { $in: posts.map(p => p._id) };
  }

  // Use cursor pagination if cursor provided (v2), otherwise skip pagination (v1)
  if (cursor !== undefined) {
    const { limit } = parseCursorPaginationParams(req.body);
    const commentQuery = Comment.find(query);
    const result = await cursorPaginate(commentQuery, { cursor, limit }, '_id', 'desc');
    
    const comments = await Promise.all(result.items.map(comment => formatComment(comment)));

    res.json({
      hasNextPage: result.hasNextPage,
      cursor: result.cursor,
      comments,
    });
  } else {
    const { skip, limit } = parsePaginationParams(req.body);
    const commentQuery = Comment.find(query).sort({ created: -1 });
    const result = await skipPaginate(commentQuery, { skip, limit });

    const comments = await Promise.all(result.items.map(comment => formatComment(comment)));

    res.json({
      hasMore: result.hasMore,
      comments,
    });
  }
});

/**
 * POST /comments/delete
 * Delete a comment
 */
export const deleteComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid comment id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback requires finding the comment first
    const comment = await Comment.findById(id);
    if (!comment) {
      throw new AppError('comment not found', 404);
    }
    // Trust the comment's companyID if it exists, or look up post
    // Assuming Comment schema has companyID based on previous usage
    companyID = comment.companyID; 
  }

  const comment = await Comment.findOneAndDelete({ _id: id, companyID });
  if (!comment) {
    throw new AppError('comment not found', 404);
  }

  // Decrement post comment count
  await Post.updateOne({ _id: comment.postID }, { $inc: { commentCount: -1 } });

  res.json('success');
});
