import type { IUser } from './user.types.js';
import type { IBoard } from './board.types.js';
import type { ICategory } from './category.types.js';
import type { ITag } from './tag.types.js';

/**
 * Post status enum - matches Canny's exact status values
 * Note: Canny uses spaces in some status values
 */
export type PostStatus =
  | 'open'
  | 'under review'
  | 'planned'
  | 'in progress'
  | 'complete'
  | 'closed';

export const POST_STATUSES: PostStatus[] = [
  'open',
  'under review',
  'planned',
  'in progress',
  'complete',
  'closed',
];

/**
 * Post interface - matches Canny API v1 response structure
 * @see https://developers.canny.io/api-reference#posts
 */
export interface IPost {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Post author */
  author: IUser;
  /** Board this post belongs to */
  board: IBoard;
  /** User who created post on behalf (for admin actions), nullable */
  by?: IUser | null;
  /** Post category, nullable */
  category?: ICategory | null;
  /** Number of comments */
  commentCount: number;
  /** Creation date (ISO 8601) */
  created: string;
  /** Post description/details (can contain HTML) */
  details: string;
  /** Estimated completion date (human readable, e.g., "February 2020") */
  eta?: string;
  /** Array of image URLs */
  imageURLs: string[];
  /** Jira integration data */
  jira?: {
    linkedIssues: IJiraIssue[];
  };
  /** Linear integration data */
  linear?: {
    linkedIssueIDs: string[];
  };
  /** Assigned owner (admin user) */
  owner?: IUser | null;
  /** Vote score (number of upvotes) */
  score: number;
  /** Current status */
  status: PostStatus;
  /** When status was last changed (ISO 8601) */
  statusChangedAt?: string;
  /** Tags assigned to this post */
  tags: ITag[];
  /** Post title */
  title: string;
  /** Public URL */
  url: string;
}

export interface IJiraIssue {
  id: string;
  key: string;
  url: string;
}

/**
 * Input for post creation - matches Canny API
 */
export interface IPostCreateInput {
  /** Author's internal ID */
  authorID: string;
  /** Board ID to create post in */
  boardID: string;
  /** Post title */
  title: string;
  /** Post details/description (HTML allowed) */
  details?: string;
  /** Category ID (optional) */
  categoryID?: string;
  /** Category name - will auto-create if doesn't exist */
  categoryName?: string;
  /** Array of tag names - will auto-create if don't exist */
  tags?: string[];
  /** Image URLs */
  imageURLs?: string[];
  /** User ID who's creating on behalf (for admin) */
  byID?: string;
}

/**
 * Input for post update
 */
export interface IPostUpdateInput {
  /** Post ID to update */
  postID: string;
  /** New title */
  title?: string;
  /** New details */
  details?: string;
  /** New status */
  status?: PostStatus;
  /** New category ID */
  categoryID?: string | null;
  /** New ETA */
  eta?: string;
  /** New owner ID */
  ownerID?: string | null;
  /** Image URLs */
  imageURLs?: string[];
}

/**
 * Post list query parameters
 */
export interface IPostListParams {
  /** Board ID to filter by */
  boardID?: string;
  /** Number of posts to return (default 10, max 100) */
  limit?: number;
  /** Number of posts to skip (for pagination) */
  skip?: number;
  /** Sort order */
  sort?: 'newest' | 'oldest' | 'score' | 'statusChanged' | 'trending';
  /** Filter by status */
  status?: PostStatus;
  /** Search query */
  search?: string;
  /** Filter by tag IDs */
  tagIDs?: string[];
  /** Filter by author ID */
  authorID?: string;
  /** Filter by owner ID */
  ownerID?: string;
}

/**
 * Internal post representation
 */
export interface IPostInternal {
  id: string;
  authorID: string;
  boardID: string;
  byID?: string;
  categoryID?: string;
  commentCount: number;
  created: Date;
  details: string;
  eta?: string;
  imageURLs: string[];
  ownerID?: string;
  score: number;
  status: PostStatus;
  statusChangedAt?: Date;
  tagIDs: string[];
  title: string;
}
