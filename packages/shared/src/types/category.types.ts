/**
 * Category interface - API response structure
 */
export interface ICategory {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Board this category belongs to */
  boardID: string;
  /** Creation date (ISO 8601) */
  created: string;
  /** Category name */
  name: string;
  /** Number of posts in this category */
  postCount: number;
  /** URL for the category */
  url: string;
}

/**
 * Input for category creation
 */
export interface ICategoryCreateInput {
  /** Board ID */
  boardID: string;
  /** Category name */
  name: string;
}

/**
 * Category list query parameters
 */
export interface ICategoryListParams {
  /** Board ID to filter by (required) */
  boardID: string;
}

/**
 * Internal category representation
 */
export interface ICategoryInternal {
  id: string;
  boardID: string;
  name: string;
  postCount: number;
  created: Date;
  createdByID?: string;
  companyID: string;
}
