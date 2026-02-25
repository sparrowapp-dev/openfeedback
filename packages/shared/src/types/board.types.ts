/**
 * Board interface - API v1 response structure
 */
export interface IBoard {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Creation date (ISO 8601) */
  created: string;
  /** Whether board is private */
  isPrivate: boolean;
  /** Board display name */
  name: string;
  /** Number of posts in this board */
  postCount: number;
  /** Whether comments are private by default */
  privateComments?: boolean;
  /** Available statuses for posts on this board */
  statuses?: string[];
  /** Board access token */
  token: string;
  /** Public URL/slug for the board */
  url: string;
}

/**
 * Input for board creation
 */
export interface IBoardCreateInput {
  name: string;
  isPrivate?: boolean;
  privateComments?: boolean;
}

/**
 * Internal board representation
 */
export interface IBoardInternal extends IBoard {
  /** Company this board belongs to */
  companyID: string;
}
