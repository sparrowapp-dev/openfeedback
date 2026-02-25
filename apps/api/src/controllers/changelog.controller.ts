import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Changelog, Post } from '../models/index.js';
import { asyncHandler, AppError, htmlToPlainText } from '../middlewares/index.js';
import { skipPaginate, parsePaginationParams, notifications } from '../utils/index.js';

/**
 * Helper to format a changelog entry for API response
 */
async function formatChangelog(entry: any) {
  // Fetch linked posts
  const posts = entry.postIDs?.length > 0
    ? await Post.find({ _id: { $in: entry.postIDs } })
    : [];

  return {
    id: entry._id.toString(),
    created: entry.created?.toISOString(),
    labels: entry.labels || [],
    lastSavedAt: entry.lastSavedAt?.toISOString(),
    markdownDetails: entry.markdownDetails || '',
    plaintextDetails: entry.plaintextDetails || '',
    posts: posts.map(p => ({
      id: p._id.toString(),
      title: p.title,
      url: `/admin/post/${p._id}`,
    })),
    publishedAt: entry.publishedAt?.toISOString() || null,
    reactions: entry.reactions || { like: 0 },
    scheduledFor: entry.scheduledFor?.toISOString() || null,
    status: entry.status,
    title: entry.title,
    types: entry.types || [],
    url: `/changelog/${entry._id}`,
  };
}

/**
 * POST /entries/list
 * List changelog entries
 */
export const listChangelog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Changelog is usually public per company subdomain
    // If no context, check if we can infer from labelIDs (unreliable)
    // For now, require context
    throw new AppError('company context required', 400);
  }
  
  const { skip, limit } = parsePaginationParams(req.body);
  const { labelIDs, type, published } = req.body;

  // Build query
  const query: Record<string, unknown> = { companyID };
  
  if (published !== undefined) {
    query.status = published ? 'published' : { $ne: 'published' };
  }
  
  if (type) {
    query.types = type;
  }

  if (labelIDs && labelIDs.length > 0) {
    query['labels.id'] = { $in: labelIDs };
  }

  const changelogQuery = Changelog.find(query).sort({ publishedAt: -1, created: -1 });
  const result = await skipPaginate(changelogQuery, { skip, limit });

  const entries = await Promise.all(result.items.map(entry => formatChangelog(entry)));

  res.json({
    hasMore: result.hasMore,
    entries,
  });
});

/**
 * POST /entries/retrieve
 * Get a changelog entry by ID
 */
export const retrieveChangelog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid entry id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback
    const entry = await Changelog.findById(id);
    if (!entry) {
      throw new AppError('entry not found', 404);
    }
    companyID = entry.companyID;
  }

  const entry = await Changelog.findOne({ _id: id, companyID });
  if (!entry) {
    throw new AppError('entry not found', 404);
  }

  const formatted = await formatChangelog(entry);
  res.json(formatted);
});

/**
 * POST /entries/create
 * Create a new changelog entry
 */
export const createChangelog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, details, labels, types, postIDs, notify } = req.body;
  
  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    throw new AppError('company context required to create changelog', 401);
  }

  // Validate post IDs if provided
  let validPostIDs: mongoose.Types.ObjectId[] = [];
  if (postIDs && postIDs.length > 0) {
    const posts = await Post.find({ _id: { $in: postIDs }, companyID });
    validPostIDs = posts.map(p => p._id);
  }

  // Convert labels to proper format
  const formattedLabels = (labels || []).map((label: string, index: number) => ({
    id: `label-${index}`,
    name: label,
  }));

  // Create entry
  const entry = await Changelog.create({
    companyID,
    title,
    markdownDetails: details || '',
    plaintextDetails: htmlToPlainText(details || ''),
    labels: formattedLabels,
    types: types || [],
    postIDs: validPostIDs,
    status: notify ? 'published' : 'draft',
    publishedAt: notify ? new Date() : undefined,
    lastSavedAt: new Date(),
  });

  // Emit notification if published
  if (notify) {
    notifications.emit('changelog.published', {
      companyID: companyID.toString(),
      data: {
        entryID: entry._id.toString(),
        title,
      },
    });
  }

  const formatted = await formatChangelog(entry);
  res.json(formatted);
});

/**
 * POST /entries/delete
 * Delete a changelog entry
 */
export const deleteChangelog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('invalid entry id', 400);
  }

  // Safely determine companyID
  let companyID: mongoose.Types.ObjectId;

  if (req.company) {
    companyID = req.company._id;
  } else if ((req as any).user?.companyID) {
    companyID = (req as any).user.companyID;
  } else {
    // Fallback
    const entry = await Changelog.findById(id);
    if (!entry) {
        throw new AppError('entry not found', 404);
    }
    companyID = entry.companyID;
  }

  const entry = await Changelog.findOneAndDelete({ _id: id, companyID });
  if (!entry) {
    throw new AppError('entry not found', 404);
  }

  res.json('success');
});
