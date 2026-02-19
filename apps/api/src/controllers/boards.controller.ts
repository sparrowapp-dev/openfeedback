import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Board, Company, Post } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';

export const listBoards = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Get companyID from authenticated user first, then subdomain/context
  let companyID: mongoose.Types.ObjectId;

  // 1. Authenticated user's company
  if ((req as any).user) {
    companyID = (req as any).user.companyID;
  }
  // 2. Company from subdomain/API key context
  else if (req.company) {
    companyID = req.company._id;
  }
  // 3. Fallback to demo company (or first found company)
  else {
    const defaultCompany = await Company.findOne({ subdomain: 'demo' }) || await Company.findOne();
    if (!defaultCompany) {
      throw new AppError('no companies found', 404);
    }
    companyID = defaultCompany._id;
  }

  // Get boards with dynamic postCount via aggregation
  const boards = await Board.aggregate([
    { $match: { companyID: new mongoose.Types.ObjectId(companyID) } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'boardID',
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
        posts: 0, // Remove posts array from output
      },
    },
    //{ $sort: { created: -1 } },
    //{ $limit: 1 },
  ]);

  // Transform to Canny format
  const formattedBoards = boards.map(board => ({
    id: board._id.toString(),
    created: board.created?.toISOString(),
    isPrivate: board.isPrivate,
    name: board.name,
    postCount: board.postCount,
    privateComments: board.privateComments || false,
    token: board.token,
    url: board.url,
  }));
  res.json({ boards: formattedBoards });
});

/**
 * POST /boards/retrieve
 * Get a single board by ID
 */
export const retrieveBoard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid board id', 400);
  }

  // For guest users, we don't filter by companyID - board IDs are globally unique
  const boardQuery = req.company 
    ? { _id: id, companyID: req.company._id } 
    : { _id: id };
  
  const board = await Board.findOne(boardQuery);

  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Get actual post count
  const postCount = await Post.countDocuments({ boardID: board._id });

  res.json({
    id: board._id.toString(),
    created: board.created.toISOString(),
    isPrivate: board.isPrivate,
    name: board.name,
    postCount,
    privateComments: board.privateComments,
    token: board.token,
    url: board.url,
  });
});

/**
 * POST /boards/create
 * Create a new board
 */
export const createBoard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, isPrivate, privateComments } = req.body;
  const companyID = req.company!._id;

  // Check for duplicate name/url
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = await Board.findOne({ companyID, url: slug });
  if (existing) {
    throw new AppError('a board with this name already exists', 400);
  }

  const board = await Board.create({
    companyID,
    name,
    url: slug,
    isPrivate: isPrivate || false,
    privateComments: privateComments || false,
  });

  res.json({
    id: board._id.toString(),
    created: board.created.toISOString(),
    isPrivate: board.isPrivate,
    name: board.name,
    postCount: 0,
    privateComments: board.privateComments,
    token: board.token,
    url: board.url,
  });
});

/**
 * POST /boards/delete
 * Delete a board
 */
export const deleteBoard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID } = req.body;
  const companyID = req.company!._id;

  if (!mongoose.Types.ObjectId.isValid(boardID)) {
    throw new AppError('invalid board id', 400);
  }

  const board = await Board.findOneAndDelete({ _id: boardID, companyID });

  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Canny returns "success" string for delete operations
  res.json('success');
});
