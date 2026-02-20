import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category, Board, Post } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';

/**
 * POST /categories/list
 * List categories for a board
 */
export const listCategories = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { boardID } = req.body;
  
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find board's company or use default
    const board = await Board.findById(boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  }

  if (!mongoose.Types.ObjectId.isValid(boardID)) {
    throw new AppError('invalid boardID', 400);
  }

  // Verify board exists
  const board = await Board.findOne({ _id: boardID, companyID });
  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Get categories with accurate post counts via aggregation
  const categories = await Category.aggregate([
    { $match: { boardID: new mongoose.Types.ObjectId(boardID), companyID } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'categoryID',
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

  const formattedCategories = categories.map(cat => ({
    id: cat._id.toString(),
    boardID: cat.boardID.toString(),
    created: cat.created?.toISOString(),
    name: cat.name,
    postCount: cat.postCount,
    url: `/admin/board/${cat.boardID}/category/${cat._id}`,
  }));

  res.json({ categories: formattedCategories });
});

/**
 * POST /categories/retrieve
 * Get a category by ID
 */
export const retrieveCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid category id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: try to find category's company
    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('category not found', 404);
    }
    companyID = category.companyID;
  }

  const category = await Category.findOne({ _id: id, companyID });
  if (!category) {
    throw new AppError('category not found', 404);
  }

  // Get accurate post count
  const postCount = await Post.countDocuments({ categoryID: category._id });

  res.json({
    id: category._id.toString(),
    boardID: category.boardID.toString(),
    created: category.created.toISOString(),
    name: category.name,
    postCount,
    url: `/admin/board/${category.boardID}/category/${category._id}`,
  });
});

/**
 * POST /categories/create
 * Create a new category (non-admin users can create - per spec requirement)
 */
export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    // Fallback: try to find board's company
    const board = await Board.findById(boardID);
    if (!board) {
      throw new AppError('board not found', 404);
    }
    companyID = board.companyID;
  }

  // Verify board exists (and belongs to company)
  const board = await Board.findOne({ _id: boardID, companyID });
  if (!board) {
    throw new AppError('board not found', 404);
  }

  // Check for duplicate
  const existing = await Category.findOne({ boardID: board._id, name });
  if (existing) {
    // Return existing category (idempotent)
    res.json({
      id: existing._id.toString(),
      boardID: existing.boardID.toString(),
      created: existing.created.toISOString(),
      name: existing.name,
      postCount: existing.postCount,
      url: `/admin/board/${existing.boardID}/category/${existing._id}`,
    });
    return;
  }

  // Create new category
  const category = await Category.create({
    companyID,
    boardID: board._id,
    name,
    postCount: 0,
  });

  res.json({
    id: category._id.toString(),
    boardID: category.boardID.toString(),
    created: category.created.toISOString(),
    name: category.name,
    postCount: 0,
    url: `/admin/board/${category.boardID}/category/${category._id}`,
  });
});

/**
 * POST /categories/delete
 * Delete a category
 */
export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  const companyID = req.company!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid category id', 400);
  }

  const category = await Category.findOneAndDelete({ _id: id, companyID });
  if (!category) {
    throw new AppError('category not found', 404);
  }

  // Remove category from all posts
  await Post.updateMany({ categoryID: category._id }, { $unset: { categoryID: 1 } });

  res.json('success');
});
