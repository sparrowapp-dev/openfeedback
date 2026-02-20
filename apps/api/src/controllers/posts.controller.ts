import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Post, User, Board, Category, Tag, Vote } from '../models/index.js';
import { asyncHandler, AppError, sanitizeContent } from '../middlewares/index.js';
import { skipPaginate, parsePaginationParams, notifications } from '../utils/index.js';
import type { PostStatus } from '../models/Post.js';

/**
 * Helper to populate and format a post for Canny-compatible response
 */
async function formatPost(post: any, companyID: mongoose.Types.ObjectId) {
  // Populate related documents
  const [author, board, category, owner, tags] = await Promise.all([
    User.findById(post.authorID),
    Board.findById(post.boardID),
    post.categoryID ? Category.findById(post.categoryID) : null,
    post.ownerID ? User.findById(post.ownerID) : null,
    Tag.find({ _id: { $in: post.tagIDs || [] } }),
  ]);

  const by = post.byID ? await User.findById(post.byID) : null;

  return {
    id: post._id.toString(),
    author: author?.toJSON() || null,
    board: board?.toJSON() || null,
    by: by?.toJSON() || null,
    category: category?.toJSON() || null,
    commentCount: post.commentCount || 0,
    created: post.created?.toISOString(),
    details: post.details || '',
    eta: post.eta || null,
    imageURLs: post.imageURLs || [],
    jira: post.jira || { linkedIssues: [] },
    linear: post.linear || { linkedIssueIDs: [] },
    owner: owner?.toJSON() || null,
    score: post.score || 0,
    status: post.status,
    statusChangedAt: post.statusChangedAt?.toISOString() || null,
    tags: tags.map(t => t.toJSON()),
    title: post.title,
    url: `/admin/post/${post._id}`,
  };
}

/**
 * POST /posts/list
 * List posts with filtering, sorting, and pagination
 */
export const listPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // For guest users, get companyID from boardID if not authenticated
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if (req.body.boardID) {
    // Guest user viewing a specific board
    const board = await Board.findById(req.body.boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  } else {
    // No auth and no boardID - use demo company
    const { Company } = await import('../models/index.js');
    const defaultCompany = await Company.findOne({ subdomain: 'demo' }) || await Company.findOne();
    if (!defaultCompany) {
      throw new AppError('no company found', 400);
    }
    companyID = defaultCompany._id;
  }
  
  const { skip, limit } = parsePaginationParams(req.body);
  const { boardID, authorID, ownerID, categoryID, status, sort, search, tagIDs } = req.body;

  // Build query
  const query: Record<string, unknown> = { companyID };
  
  if (boardID) {
    if (!mongoose.Types.ObjectId.isValid(boardID)) {
      throw new AppError('invalid boardID', 400);
    }
    query.boardID = new mongoose.Types.ObjectId(boardID);
  }
  
  if (authorID) query.authorID = new mongoose.Types.ObjectId(authorID);
  if (ownerID) query.ownerID = new mongoose.Types.ObjectId(ownerID);
  if (categoryID) query.categoryID = new mongoose.Types.ObjectId(categoryID);
  if (status) query.status = status;
  if (tagIDs && tagIDs.length > 0) {
    query.tagIDs = { $in: tagIDs.map((id: string) => new mongoose.Types.ObjectId(id)) };
  }

  // Build sort
  let sortObj: Record<string, 1 | -1> = { created: -1 }; // Default: newest
  switch (sort) {
    case 'oldest':
      sortObj = { created: 1 };
      break;
    case 'score':
      sortObj = { score: -1, created: -1 };
      break;
    case 'statusChanged':
      sortObj = { statusChangedAt: -1, created: -1 };
      break;
    case 'trending':
      // Trending: combination of recent activity and score
      sortObj = { score: -1, created: -1 };
      break;
  }

  let postQuery = Post.find(query).sort(sortObj);

  // Handle text search
  if (search) {
    postQuery = Post.find({ ...query, $text: { $search: search } }).sort(sortObj);
  }

  const result = await skipPaginate(postQuery, { skip, limit });

  // Format posts
  const posts = await Promise.all(
    result.items.map(post => formatPost(post, companyID))
  );

  res.json({
    hasMore: result.hasMore,
    posts,
  });
});

/**
 * POST /posts/retrieve
 * Get a single post by ID
 */
export const retrievePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid post id', 400);
  }

  // For guest users, we don't filter by companyID - post IDs are globally unique
  const postQuery = req.company 
    ? { _id: id, companyID: req.company._id }
    : { _id: id };
  
  const post = await Post.findOne(postQuery);
  if (!post) {
    throw new AppError('post not found', 404);
  }

  const formatted = await formatPost(post, post.companyID);
  res.json(formatted);
});

/**
 * POST /posts/create
 * Create a new post
 */
export const createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { authorID, boardID, title, details, categoryID, imageURLs, byID } = req.body;

  // Validate board exists first (needed to get companyID for guest users)
  if (!mongoose.Types.ObjectId.isValid(boardID)) {
    throw new AppError('invalid boardID', 400);
  }
  const board = await Board.findById(boardID);
  if (!board) {
    throw new AppError('board not found', 404);
  }

  const companyID = board.companyID;

  // Validate author exists
  if (!mongoose.Types.ObjectId.isValid(authorID)) {
    throw new AppError('invalid authorID', 400);
  }
  const author = await User.findOne({ _id: authorID, companyID });
  if (!author) {
    throw new AppError('author not found', 404);
  }

  // Validate category if provided
  let validCategoryID: mongoose.Types.ObjectId | undefined;
  if (categoryID) {
    if (!mongoose.Types.ObjectId.isValid(categoryID)) {
      throw new AppError('invalid categoryID', 400);
    }
    const category = await Category.findOne({ _id: categoryID, boardID });
    if (!category) {
      throw new AppError('category not found', 404);
    }
    validCategoryID = category._id;
  }

  // Sanitize HTML content
  const sanitizedDetails = sanitizeContent(details || '');

  // Create post
  const post = await Post.create({
    companyID,
    boardID: board._id,
    authorID: author._id,
    byID: byID ? new mongoose.Types.ObjectId(byID) : undefined,
    categoryID: validCategoryID,
    title,
    details: sanitizedDetails,
    imageURLs: imageURLs || [],
    status: 'open',
    score: 0,
    commentCount: 0,
  });

  // Update board post count
  await Board.updateOne({ _id: board._id }, { $inc: { postCount: 1 } });

  // Update category post count if applicable
  if (validCategoryID) {
    await Category.updateOne({ _id: validCategoryID }, { $inc: { postCount: 1 } });
  }

  // Auto-upvote by author
  await Vote.create({
    companyID,
    postID: post._id,
    voterID: author._id,
  });
  await Post.updateOne({ _id: post._id }, { $inc: { score: 1 } });

  // Emit notification
  notifications.emit('post.created', {
    companyID: companyID.toString(),
    data: { postID: post._id.toString(), title, boardID: board._id.toString() },
  });

  const formatted = await formatPost(post, companyID);
  res.json(formatted);
});

/**
 * POST /posts/update
 * Update a post
 */
export const updatePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, title, details, categoryID, ownerID, eta, imageURLs } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    throw new AppError('invalid postID', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find post's company
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  }

  const post = await Post.findOne({ _id: postID, companyID });
  if (!post) {
    throw new AppError('post not found', 404);
  }

  // Build update object
  const update: Record<string, unknown> = {};
  
  if (title !== undefined) update.title = title;
  if (details !== undefined) update.details = sanitizeContent(details);
  if (eta !== undefined) update.eta = eta;
  if (imageURLs !== undefined) update.imageURLs = imageURLs;
  
  if (categoryID !== undefined) {
    if (categoryID === null) {
      update.categoryID = null;
    } else if (mongoose.Types.ObjectId.isValid(categoryID)) {
      const category = await Category.findOne({ _id: categoryID, boardID: post.boardID });
      if (!category) {
        throw new AppError('category not found', 404);
      }
      update.categoryID = category._id;
    }
  }

  if (ownerID !== undefined) {
    if (ownerID === null) {
      update.ownerID = null;
    } else if (mongoose.Types.ObjectId.isValid(ownerID)) {
      const owner = await User.findOne({ _id: ownerID, companyID });
      if (!owner) {
        throw new AppError('owner not found', 404);
      }
      update.ownerID = owner._id;
    }
  }

  const updated = await Post.findByIdAndUpdate(postID, { $set: update }, { new: true });
  const formatted = await formatPost(updated, companyID);
  res.json(formatted);
});

/**
 * POST /posts/change_status
 * Change post status
 */
export const changePostStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, changerID, status, commentValue } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    throw new AppError('invalid postID', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find post's company
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  }

  const post = await Post.findOne({ _id: postID, companyID });
  if (!post) {
    throw new AppError('post not found', 404);
  }

  const oldStatus = post.status;
  
  // Update status
  post.status = status as PostStatus;
  post.statusChangedAt = new Date();
  await post.save();

  // Emit notification if status changed
  if (oldStatus !== status) {
    notifications.emit('post.statusChanged', {
      companyID: companyID.toString(),
      data: {
        postID: post._id.toString(),
        oldStatus,
        newStatus: status,
        changerID,
      },
    });
  }

  const formatted = await formatPost(post, companyID);
  res.json(formatted);
});

/**
 * POST /posts/delete
 * Delete a post
 */
export const deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid post id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find post's company
    const post = await Post.findById(id);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  }

  const post = await Post.findOneAndDelete({ _id: id, companyID });
  if (!post) {
    throw new AppError('post not found', 404);
  }

  // Update board post count
  await Board.updateOne({ _id: post.boardID }, { $inc: { postCount: -1 } });

  // Update category post count
  if (post.categoryID) {
    await Category.updateOne({ _id: post.categoryID }, { $inc: { postCount: -1 } });
  }

  // Delete related votes
  await Vote.deleteMany({ postID: post._id });

  res.json('success');
});

/**
 * POST /posts/add_tag
 * Add a tag to a post
 */
export const addTagToPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, tagID } = req.body;
  
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find post's company
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  }

  const post = await Post.findOne({ _id: postID, companyID });
  if (!post) {
    throw new AppError('post not found', 404);
  }

  const tag = await Tag.findOne({ _id: tagID, boardID: post.boardID });
  if (!tag) {
    throw new AppError('tag not found', 404);
  }

  // Add tag if not already present
  if (!post.tagIDs.includes(tag._id)) {
  
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find post's company
    const post = await Post.findById(postID);
    if (!post) {
      throw new AppError('post not found', 404);
    }
    companyID = post.companyID;
  }
    await post.save();
    await Tag.updateOne({ _id: tag._id }, { $inc: { postCount: 1 } });
  }

  const formatted = await formatPost(post, companyID);
  res.json(formatted);
});

/**
 * POST /posts/remove_tag
 * Remove a tag from a post
 */
export const removeTagFromPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, tagID } = req.body;
  const companyID = req.company!._id;

  const post = await Post.findOne({ _id: postID, companyID });
  if (!post) {
    throw new AppError('post not found', 404);
  }

  // Remove tag
  const tagIndex = post.tagIDs.findIndex(id => id.toString() === tagID);
  if (tagIndex > -1) {
    post.tagIDs.splice(tagIndex, 1);
    await post.save();
    await Tag.updateOne({ _id: tagID }, { $inc: { postCount: -1 } });
  }

  const formatted = await formatPost(post, companyID);
  res.json(formatted);
});
