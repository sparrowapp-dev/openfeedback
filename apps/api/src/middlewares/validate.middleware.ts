import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { AppError } from './error.middleware.js';

/**
 * Validation middleware factory
 * Validates request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract first error message for standard format
        const firstError = error.errors[0];
        const message = firstError?.message || 'validation error';
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Common validation schemas for API requests
 */

// MongoDB ObjectID validation
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id format');

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  skip: z.coerce.number().min(0).default(0).optional(),
});

export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  cursor: z.string().optional(),
});

// Board schemas
export const boardListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema.optional(),
});

export const boardRetrieveSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema,
});

export const boardCreateSchema = z.object({
  apiKey: z.string().optional(),
  name: z.string().min(1).max(100),
  isPrivate: z.boolean().default(false).optional(),
  privateComments: z.boolean().default(false).optional(),
});

// User schemas
export const userCreateOrUpdateSchema = z.object({
  apiKey: z.string().optional(),
  userID: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  avatarURL: z.string().url().optional(),
  customFields: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  companies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    monthlySpend: z.number().optional(),
    customFields: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  })).optional(),
});

export const userRetrieveSchema = z.object({
  apiKey: z.string().optional(),
  id: objectIdSchema.optional(),
  userID: z.string().optional(),
  email: z.string().email().optional(),
}).refine(
  data => data.id || data.userID || data.email,
  { message: 'must provide id, userID, or email' }
);

export const userDeleteSchema = z.object({
  apiKey: z.string().optional(),
  id: objectIdSchema,
});

// Post schemas
export const postListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema.optional(),
  authorID: objectIdSchema.optional(),
  ownerID: objectIdSchema.optional(),
  categoryID: objectIdSchema.optional(),
  tagIDs: z.array(objectIdSchema).optional(),
  status: z.union([
    z.enum(['open', 'under review', 'planned', 'in progress', 'complete', 'closed']).transform(val => [val]),
    z.string().transform(val => val.split(',').map(s => s.trim())).pipe(z.array(z.enum(['open', 'under review', 'planned', 'in progress', 'complete', 'closed']))),
    z.array(z.enum(['open', 'under review', 'planned', 'in progress', 'complete', 'closed']))
  ]).optional(),
  sort: z.enum(['newest', 'oldest', 'score', 'statusChanged', 'trending']).default('newest').optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  skip: z.coerce.number().min(0).default(0).optional(),
});

export const postRetrieveSchema = z.object({
  apiKey: z.string().optional(),
  id: objectIdSchema,
});

export const postCreateSchema = z.object({
  apiKey: z.string().optional(),
  authorID: objectIdSchema,
  boardID: objectIdSchema,
  title: z.string().min(1).max(500),
  details: z.string().max(50000).default('').optional(),
  categoryID: objectIdSchema.optional(),
  imageURLs: z.array(z.string().url()).optional(),
  byID: objectIdSchema.optional(),
});

export const postUpdateSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  title: z.string().min(1).max(500).optional(),
  details: z.string().max(50000).optional(),
  categoryID: objectIdSchema.nullable().optional(),
  ownerID: objectIdSchema.nullable().optional(),
  eta: z.string().optional(),
  imageURLs: z.array(z.string().url()).optional(),
});

export const postChangeStatusSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  changerID: objectIdSchema,
  status: z.enum(['open', 'under review', 'planned', 'in progress', 'complete', 'closed']),
  commentValue: z.string().optional(),
});

export const postAddTagSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  tagID: objectIdSchema,
});

// Vote schemas
export const voteCreateSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  voterID: objectIdSchema,
  byID: objectIdSchema.optional(),
});

export const voteDeleteSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  voterID: objectIdSchema,
});

export const voteListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema.optional(),
  postID: objectIdSchema.optional(),
  userID: objectIdSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  skip: z.coerce.number().min(0).default(0).optional(),
});

// Comment schemas
export const commentCreateSchema = z.object({
  apiKey: z.string().optional(),
  postID: objectIdSchema,
  authorID: objectIdSchema,
  value: z.string().min(1).max(10000),
  parentID: objectIdSchema.optional(),
  imageURLs: z.array(z.string().url()).optional(),
  internal: z.boolean().default(false).optional(),
});

export const commentListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema.optional(),
  postID: objectIdSchema.optional(),
  authorID: objectIdSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  skip: z.coerce.number().min(0).default(0).optional(),
});

export const commentDeleteSchema = z.object({
  apiKey: z.string().optional(),
  id: objectIdSchema,
});

// Category schemas
export const categoryListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema,
});

export const categoryCreateSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema,
  name: z.string().min(1).max(100),
});

// Tag schemas
export const tagListSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema,
});

export const tagCreateSchema = z.object({
  apiKey: z.string().optional(),
  boardID: objectIdSchema,
  name: z.string().min(1).max(50),
});

// Changelog schemas
export const changelogListSchema = z.object({
  apiKey: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  skip: z.coerce.number().min(0).default(0).optional(),
  labelIDs: z.array(z.string()).optional(),
  type: z.string().optional(),
  published: z.boolean().optional(),
});

export const changelogCreateSchema = z.object({
  apiKey: z.string().optional(),
  title: z.string().min(1).max(500),
  details: z.string().max(100000).default(''),
  labels: z.array(z.string()).optional(),
  types: z.array(z.enum(['new', 'improved', 'fixed'])).optional(),
  postIDs: z.array(objectIdSchema).optional(),
  notify: z.boolean().default(false).optional(),
});

export const changelogUpdateSchema = z.object({
  apiKey: z.string().optional(),
  id: objectIdSchema,
  title: z.string().min(1).max(500).optional(),
  details: z.string().max(100000).optional(),
  labels: z.array(z.string()).optional(),
  types: z.array(z.enum(['new', 'improved', 'fixed'])).optional(),
  postIDs: z.array(objectIdSchema).optional(),
  // When true, mark as published (and set publishedAt); when false, mark as draft
  publish: z.boolean().optional(),
});
