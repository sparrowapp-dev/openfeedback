import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/index.js';
import { cursorPaginate, parseCursorPaginationParams } from '../utils/index.js';

/**
 * POST /users/create_or_update
 * Create or update a user (upsert)
 * Canny-compatible: returns { id: "..." }
 */
export const createOrUpdateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userID, name, email, avatarURL, customFields, companies } = req.body;
  
  // For guest users without auth, use the first company (or demo company)
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else {
    // Find default company (demo company or first available)
    const { Company } = await import('../models/index.js');
    const defaultCompany = await Company.findOne({ subdomain: 'demo' }) || await Company.findOne();
    
    if (!defaultCompany) {
      throw new AppError('no company found. please create a company first', 400);
    }
    
    companyID = defaultCompany._id;
  }

  // Determine if this is a shadow user (no email)
  const isShadow = !email;

  const user = await User.findOneAndUpdate(
    { companyID, userID },
    {
      $set: {
        name,
        email: email || null,
        avatarURL,
        customFields,
        companies,
        isShadow,
        lastActivity: new Date(),
      },
      $setOnInsert: {
        companyID,
        userID,
        created: new Date(),
        isAdmin: false,
      },
    },
    { upsert: true, new: true }
  );

  // Canny returns just the internal ID
  res.json({ id: user._id.toString() });
});

/**
 * POST /users/retrieve
 * Retrieve a user by id, userID, or email (in priority order)
 */
export const retrieveUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, userID, email } = req.body;
  const companyID = req.company!._id;

  const user = await User.findByIdentifier(companyID, { id, userID, email });

  if (!user) {
    throw new AppError('user not found', 404);
  }

  res.json(user.toJSON());
});

/**
 * POST /users/list (v2 - cursor pagination)
 * List users with cursor-based pagination
 */
export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const companyID = req.company!._id;
  const { cursor, limit } = parseCursorPaginationParams(req.body);

  const query = User.find({ companyID });
  const result = await cursorPaginate(query, { cursor, limit }, '_id', 'desc');

  res.json({
    hasNextPage: result.hasNextPage,
    cursor: result.cursor,
    users: result.items.map(user => user.toJSON()),
  });
});

/**
 * POST /users/delete
 * Delete a user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  const companyID = req.company!._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid user id', 400);
  }

  const user = await User.findOneAndDelete({ _id: id, companyID });

  if (!user) {
    throw new AppError('user not found', 404);
  }

  // Canny returns "success" string for delete operations
  res.json('success');
});
