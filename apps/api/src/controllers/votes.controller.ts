import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Vote, Post, User, Board } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';
import { skipPaginate, cursorPaginate, parsePaginationParams, parseCursorPaginationParams } from '../utils/index.js';

/**
 * Helper to format a vote for Canny-compatible response
 */
async function formatVote(vote: any) {
  const [voter, post] = await Promise.all([
    User.findById(vote.voterID),
    Post.findById(vote.postID),
  ]);

  const board = post ? await Board.findById(post.boardID) : null;
  const by = vote.byID ? await User.findById(vote.byID) : null;

  return {
    id: vote._id.toString(),
    board: board?.toJSON() || null,
    by: by?.toJSON() || null,
    created: vote.created?.toISOString(),
    post: post ? {
      id: post._id.toString(),
      title: post.title,
      url: `/admin/post/${post._id}`,
    } : null,
    voter: voter?.toJSON() || null,
    votePriority: vote.votePriority || 'No priority',
  };
}

/**
 * POST /votes/create
 * Create a vote (idempotent - ignore duplicates)
 */
export const createVote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, voterID, byID } = req.body;

  // Validate post exists first (needed to get companyID for guest users)
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    throw new AppError('invalid postID', 400);
  }
  const post = await Post.findById(postID);
  if (!post) {
    throw new AppError('post not found', 404);
  }

  const companyID = post.companyID;

  // Validate voter exists
  if (!mongoose.Types.ObjectId.isValid(voterID)) {
    throw new AppError('invalid voterID', 400);
  }
  const voter = await User.findOne({ _id: voterID, companyID });
  if (!voter) {
    throw new AppError('voter not found', 404);
  }

  // Check for existing vote (idempotent)
  let vote = await Vote.findOne({ postID: post._id, voterID: voter._id });

  if (!vote) {
    // Create new vote
    vote = await Vote.create({
      companyID,
      postID: post._id,
      voterID: voter._id,
      byID: byID ? new mongoose.Types.ObjectId(byID) : undefined,
    });

    // Atomically increment post score
    await Post.updateOne({ _id: post._id }, { $inc: { score: 1 } });
  }

  const formatted = await formatVote(vote);
  res.json(formatted);
});

/**
 * POST /votes/retrieve
 * Get a vote by ID
 */
export const retrieveVote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid vote id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback
    const vote = await Vote.findById(id);
    if (!vote) {
      throw new AppError('vote not found', 404);
    }
    companyID = vote.companyID;
  }

  const vote = await Vote.findOne({ _id: id, companyID });
  if (!vote) {
    throw new AppError('vote not found', 404);
  }

  const formatted = await formatVote(vote);
  res.json(formatted);
});

/**
 * POST /votes/list (supports both v1 skip and v2 cursor pagination)
 * List votes for a post, board, or user
 */
export const listVotes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID, postID, userID, cursor } = req.body;

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
  
  if (userID) {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      throw new AppError('invalid userID', 400);
    }
    query.voterID = new mongoose.Types.ObjectId(userID);
  }

  if (boardID) {
    // Need to find all posts in the board first
    const posts = await Post.find({ boardID: new mongoose.Types.ObjectId(boardID), companyID }).select('_id');
    query.postID = { $in: posts.map(p => p._id) };
  }

  // Use cursor pagination if cursor provided (v2), otherwise skip pagination (v1)
  if (cursor !== undefined) {
    const { limit } = parseCursorPaginationParams(req.body);
    const voteQuery = Vote.find(query);
    const result = await cursorPaginate(voteQuery, { cursor, limit }, '_id', 'desc');
    
    const votes = await Promise.all(result.items.map(vote => formatVote(vote)));

    res.json({
      hasNextPage: result.hasNextPage,
      cursor: result.cursor,
      votes,
    });
  } else {
    const { skip, limit } = parsePaginationParams(req.body);
    const voteQuery = Vote.find(query).sort({ created: -1 });
    const result = await skipPaginate(voteQuery, { skip, limit });

    const votes = await Promise.all(result.items.map(vote => formatVote(vote)));

    res.json({
      hasMore: result.hasMore,
      votes,
    });
  }
});

/**
 * POST /votes/delete
 * Remove a vote
 */
export const deleteVote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { postID, voterID } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postID) || !mongoose.Types.ObjectId.isValid(voterID)) {
    throw new AppError('invalid postID or voterID', 400);
  }

  // Validate post exists first (needed to get companyID for guest users)
  const post = await Post.findById(postID);
  if (!post) {
    throw new AppError('post not found', 404);
  }
  const companyID = post.companyID;

  const vote = await Vote.findOneAndDelete({
    companyID,
    postID: new mongoose.Types.ObjectId(postID),
    voterID: new mongoose.Types.ObjectId(voterID),
  });

  if (vote) {
    // Atomically decrement post score
    await Post.updateOne({ _id: postID }, { $inc: { score: -1 } });
  }

  // Canny returns "success" even if vote didn't exist
  res.json('success');
});
