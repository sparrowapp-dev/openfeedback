import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Tag, Board, Post } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';

/**
 * POST /tags/list
 * List tags for a board
 */
export const listTags = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(boardID)) {
    throw new AppError('invalid boardID', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: use board's company
    const board = await Board.findById(boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  }

  // Verify board exists
  const board = await Board.findOne({ _id: boardID, companyID });
  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Get tags with accurate post counts via aggregation
  const tags = await Tag.aggregate([
    { $match: { boardID: new mongoose.Types.ObjectId(boardID), companyID } },
    {
      $lookup: {
        from: 'posts',
        let: { tagId: '$_id' },
        pipeline: [
          { $match: { $expr: { $in: ['$$tagId', '$tagIDs'] } } },
        ],
        as: 'posts',
      },
    },
    {
      $addFields: {
        postCount: { $size: '$posts' },
      },
    },
    {
      $project: {
        posts: 0,
      },
    },
    { $sort: { name: 1 } },
  ]);

  const formattedTags = tags.map(tag => ({
    id: tag._id.toString(),
    boardID: tag.boardID.toString(),
    created: tag.created?.toISOString(),
    name: tag.name,
    postCount: tag.postCount,
    url: `/admin/board/${tag.boardID}/tag/${tag._id}`,
  }));

  res.json({ tags: formattedTags });
});

/**
 * POST /tags/retrieve
 * Get a tag by ID
 */
export const retrieveTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid tag id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new AppError('tag not found', 404);
    }
    companyID = tag.companyID;
  }

  const tag = await Tag.findOne({ _id: id, companyID });
  if (!tag) {
    throw new AppError('tag not found', 404);
  }

  // Get accurate post count
  const postCount = await Post.countDocuments({ tagIDs: tag._id });

  res.json({
    id: tag._id.toString(),
    boardID: tag.boardID.toString(),
    created: tag.created.toISOString(),
    name: tag.name,
    postCount,
    url: `/admin/board/${tag.boardID}/tag/${tag._id}`,
  });
});

/**
 * POST /tags/create
 * Create a new tag
 */
export const createTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID, name } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(boardID)) {
    throw new AppError('invalid boardID', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: use board's company
    const board = await Board.findById(boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  }

  // Verify board exists
  const board = await Board.findOne({ _id: boardID, companyID });
  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Check for duplicate
  const existing = await Tag.findOne({ boardID: board._id, name });
  if (existing) {
    // Return existing tag (idempotent)
    res.json({
      id: existing._id.toString(),
      boardID: existing.boardID.toString(),
      created: existing.created.toISOString(),
      name: existing.name,
      postCount: existing.postCount,
      url: `/admin/board/${existing.boardID}/tag/${existing._id}`,
    });
    return;
  }

  // Create new tag
  const tag = await Tag.create({
    companyID,
    boardID: board._id,
    name,
    postCount: 0,
  });

  res.json({
    id: tag._id.toString(),
    boardID: tag.boardID.toString(),
    created: tag.created.toISOString(),
    name: tag.name,
    postCount: 0,
    url: `/admin/board/${tag.boardID}/tag/${tag._id}`,
  });
});

/**
 * POST /tags/delete
 * Delete a tag
 */
export const deleteTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid tag id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new AppError('tag not found', 404);
    }
    companyID = tag.companyID;
  }

  const tag = await Tag.findOneAndDelete({ _id: id, companyID });
  if (!tag) {
    throw new AppError('tag not found', 404);
  }

  // Remove tag from all posts
  await Post.updateMany({ tagIDs: tag._id }, { $pull: { tagIDs: tag._id } });

  res.json('success');
});
