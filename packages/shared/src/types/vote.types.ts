import type { IUser } from './user.types.js';
import type { IBoard } from './board.types.js';

/**
 * Vote interface - API v1 response structure
 */
export interface IVote {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Board the voted post belongs to */
  board: IBoard;
  /** User who cast vote on behalf (for admin actions), nullable */
  by?: IUser | null;
  /** Vote creation date (ISO 8601) */
  created: string;
  /** Post that was voted on (may be partial) */
  post: IVotePost;
  /** User who cast the vote */
  voter: IUser;
  /** Vote priority indicator */
  votePriority?: string;
}

/**
 * Partial post object included in vote responses
 */
export interface IVotePost {
  id: string;
  title: string;
  url: string;
}

/**
 * Input for vote creation
 */
export interface IVoteCreateInput {
  /** Post ID to vote on */
  postID: string;
  /** Voter's internal ID */
  voterID: string;
  /** User creating vote on behalf (optional, for admin) */
  byID?: string;
}

/**
 * Vote list query parameters
 */
export interface IVoteListParams {
  /** Board ID to filter by */
  boardID?: string;
  /** Post ID to filter by */
  postID?: string;
  /** User ID to filter votes by voter */
  userID?: string;
  /** Number of votes to return (default 10, max 100) */
  limit?: number;
  /** Skip-based pagination (v1) */
  skip?: number;
  /** Cursor for cursor-based pagination (v2) */
  cursor?: string;
}

/**
 * Internal vote representation
 */
export interface IVoteInternal {
  id: string;
  postID: string;
  voterID: string;
  byID?: string;
  created: Date;
  companyID: string;
}
