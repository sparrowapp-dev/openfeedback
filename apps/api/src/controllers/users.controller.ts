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
  
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // If searching by internal ID, we can find the user first
    if (id && mongoose.Types.ObjectId.isValid(id)) {
        const found = await User.findById(id);
        if (!found)    throw new AppError('user not found', 404);
        companyID = found.companyID;
    } else {
        // Without ID, we can't search without company context
        throw new AppError('company context required to retrieve user by external ID/email', 400); 
    }
  }

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
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    throw new AppError('company context required to list users', 400);
  }

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
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid user id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;
  
  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback: use user's company
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('user not found', 404);
    }
    companyID = user.companyID;
  }

  const user = await User.findOneAndDelete({ _id: id, companyID });

  if (!user) {
    throw new AppError('user not found', 404);
  }

  // Canny returns "success" string for delete operations
  res.json('success');
});
