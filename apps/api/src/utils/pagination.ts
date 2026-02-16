import { Query, Document } from 'mongoose';

/**
 * Skip-based pagination result (Canny API v1 style)
 */
export interface SkipPaginationResult<T> {
  items: T[];
  hasMore: boolean;
}

/**
 * Cursor-based pagination result (Canny API v2 style)
 */
export interface CursorPaginationResult<T> {
  items: T[];
  hasNextPage: boolean;
  cursor?: string;
}

/**
 * Apply skip-based pagination to a Mongoose query (v1 style)
 */
export async function skipPaginate<T extends Document>(
  query: Query<T[], T>,
  options: { skip?: number; limit?: number }
): Promise<SkipPaginationResult<T>> {
  const skip = options.skip || 0;
  const limit = Math.min(options.limit || 10, 100);

  // Fetch one extra to determine if there are more results
  const items = await query.skip(skip).limit(limit + 1).exec();
  
  const hasMore = items.length > limit;
  if (hasMore) {
    items.pop(); // Remove the extra item
  }

  return { items, hasMore };
}

/**
 * Apply cursor-based pagination to a Mongoose query (v2 style)
 * Cursor is the _id of the last document
 */
export async function cursorPaginate<T extends Document>(
  query: Query<T[], T>,
  options: { cursor?: string; limit?: number },
  sortField: string = '_id',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<CursorPaginationResult<T>> {
  const limit = Math.min(options.limit || 10, 100);

  // Apply cursor condition if provided
  if (options.cursor) {
    const cursorCondition = sortDirection === 'desc'
      ? { [sortField]: { $lt: options.cursor } }
      : { [sortField]: { $gt: options.cursor } };
    query = query.where(cursorCondition);
  }

  // Apply sort
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection === 'desc' ? -1 : 1 };
  query = query.sort(sortObj);

  // Fetch one extra to determine if there's a next page
  const items = await query.limit(limit + 1).exec();

  const hasNextPage = items.length > limit;
  if (hasNextPage) {
    items.pop();
  }

  // Get cursor from last item
  const lastItem = items[items.length - 1];
  const cursor = lastItem ? (lastItem as any)[sortField]?.toString() : undefined;

  return { items, hasNextPage, cursor };
}

/**
 * Parse pagination parameters from request body
 */
export function parsePaginationParams(body: Record<string, unknown>): {
  skip: number;
  limit: number;
} {
  return {
    skip: Math.max(0, parseInt(String(body.skip)) || 0),
    limit: Math.min(100, Math.max(1, parseInt(String(body.limit)) || 10)),
  };
}

/**
 * Parse cursor pagination parameters from request body
 */
export function parseCursorPaginationParams(body: Record<string, unknown>): {
  cursor?: string;
  limit: number;
} {
  return {
    cursor: body.cursor as string | undefined,
    limit: Math.min(100, Math.max(1, parseInt(String(body.limit)) || 10)),
  };
}
