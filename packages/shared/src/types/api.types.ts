/**
 * Generic skip-based pagination response (Canny API v1 style)
 */
export interface ISkipPaginatedResponse<T> {
  /** Whether there are more results */
  hasMore: boolean;
  /** Array of items */
  [key: string]: T[] | boolean | undefined;
}

/**
 * Boards list response
 */
export interface IBoardsListResponse {
  boards: import('./board.types.js').IBoard[];
}

/**
 * Posts list response
 */
export interface IPostsListResponse {
  hasMore: boolean;
  posts: import('./post.types.js').IPost[];
}

/**
 * Generic cursor-based pagination response (Canny API v2 style)
 */
export interface ICursorPaginatedResponse<T> {
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Cursor for next page */
  cursor?: string;
  /** Array of items */
  [key: string]: T[] | boolean | string | undefined;
}

/**
 * Users list response (v2 with cursor pagination)
 */
export interface IUsersListResponse {
  hasNextPage: boolean;
  cursor?: string;
  users: import('./user.types.js').IUser[];
}

/**
 * Votes list response (v2 with cursor pagination)
 */
export interface IVotesListResponse {
  hasNextPage: boolean;
  cursor?: string;
  votes: import('./vote.types.js').IVote[];
}

/**
 * Comments list response (v2 with cursor pagination)
 */
export interface ICommentsListResponse {
  hasNextPage: boolean;
  cursor?: string;
  comments: import('./comment.types.js').IComment[];
}

/**
 * Standard error response
 */
export interface IErrorResponse {
  error: string;
}

/**
 * Success response for delete operations
 */
export type IDeleteResponse = 'success';

/**
 * API request with apiKey
 */
export interface IApiRequest {
  /** API key for authentication */
  apiKey: string;
}
