/**
 * Tag interface - API response structure
 */
export interface ITag {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Board this tag belongs to */
  boardID: string;
  /** Creation date (ISO 8601) */
  created: string;
  /** Tag name */
  name: string;
  /** Number of posts with this tag */
  postCount: number;
  /** URL for the tag */
  url: string;
}

/**
 * Input for tag creation
 */
export interface ITagCreateInput {
  /** Board ID */
  boardID: string;
  /** Tag name */
  name: string;
}

/**
 * Tag list query parameters
 */
export interface ITagListParams {
  /** Board ID to filter by (required) */
  boardID: string;
}

/**
 * Internal tag representation
 */
export interface ITagInternal {
  id: string;
  boardID: string;
  name: string;
  postCount: number;
  created: Date;
  companyID: string;
}
