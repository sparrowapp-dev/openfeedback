import type { IUser } from './user.types.js';
import type { IBoard } from './board.types.js';

/**
 * Comment interface - matches Canny API v1 response structure
 * @see https://developers.canny.io/api-reference#comments
 */
export interface IComment {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Comment author */
  author: IUser;
  /** Board the post belongs to */
  board: IBoard;
  /** Creation date (ISO 8601) */
  created: string;
  /** Array of image URLs */
  imageURLs: string[];
  /** Whether this is an internal/private comment */
  internal: boolean;
  /** Number of likes */
  likeCount: number;
  /** Mentioned users */
  mentions: IUser[];
  /** Parent comment ID for threading (null for top-level) */
  parentID: string | null;
  /** Post this comment belongs to (may be partial) */
  post: ICommentPost;
  /** Whether comment is private (visible only to admins) */
  private: boolean;
  /** Reactions breakdown */
  reactions?: {
    like?: number;
  };
  /** Comment text content */
  value: string;
}

/**
 * Partial post object included in comment responses
 */
export interface ICommentPost {
  id: string;
  title: string;
  url: string;
}

/**
 * Input for comment creation - matches Canny API
 */
export interface ICommentCreateInput {
  /** Post ID to comment on */
  postID: string;
  /** Author's internal ID */
  authorID: string;
  /** Comment text */
  value: string;
  /** Parent comment ID for replies */
  parentID?: string;
  /** Image URLs */
  imageURLs?: string[];
  /** Whether this is an internal note */
  internal?: boolean;
  /** User creating on behalf (for admin) */
  byID?: string;
}

/**
 * Comment list query parameters
 */
export interface ICommentListParams {
  /** Board ID to filter by */
  boardID?: string;
  /** Post ID to filter by */
  postID?: string;
  /** Author ID to filter by */
  authorID?: string;
  /** Number to return (default 10, max 100) */
  limit?: number;
  /** Skip-based pagination (v1) */
  skip?: number;
  /** Cursor for cursor-based pagination (v2) */
  cursor?: string;
}

/**
 * Internal comment representation
 */
export interface ICommentInternal {
  id: string;
  postID: string;
  authorID: string;
  value: string;
  parentID?: string;
  imageURLs: string[];
  internal: boolean;
  likeCount: number;
  created: Date;
  companyID: string;
}
