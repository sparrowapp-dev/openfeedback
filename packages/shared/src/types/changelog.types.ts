import type { IPost } from './post.types.js';

/**
 * Changelog entry interface - API response structure
 */
export interface IChangelog {
  /** Internal ID (MongoDB ObjectID) */
  id: string;
  /** Creation date (ISO 8601) */
  created: string;
  /** Labels/categories for the changelog entry (deprecated) */
  labels?: IChangelogLabel[];
  /** Last saved date (ISO 8601) */
  lastSavedAt: string;
  /** Markdown content */
  markdownDetails: string;
  /** Plain text content (no HTML) */
  plaintextDetails: string;
  /** Short description (alias of plaintextDetails for older frontends) */
  description?: string;
  /** Linked feature request posts */
  posts: IPost[];
  /** Published date (ISO 8601), null if draft */
  publishedAt: string | null;
  /** Reactions breakdown */
  reactions?: {
    like?: number;
  };
  /** Scheduled publish date (ISO 8601) */
  scheduledFor?: string | null;
  /** Release date for the changelog entry (ISO 8601) */
  releaseDate?: string | null;
  /** Entry status */
  status: 'draft' | 'published' | 'scheduled';
  /** Entry title */
  title: string;
  /** Changelog types (e.g., 'new', 'improved', 'fixed') */
  types: string[];
  /** Public URL */
  url: string;
}

export interface IChangelogLabel {
  id: string;
  name: string;
  color?: string;
}

/**
 * Input for changelog entry creation
 */
export interface IChangelogCreateInput {
  /** Entry title */
  title: string;
  /** Markdown content */
  markdownDetails: string;
  /** Types (new, improved, fixed) */
  types?: string[];
  /** Post IDs to link */
  postIDs?: string[];
  /** Whether to publish immediately */
  publish?: boolean;
  /** Schedule for future date */
  scheduledFor?: string;
  /** Release date (ISO 8601) */
  releaseDate?: string;
}

/**
 * Input for updating an existing changelog entry
 */
export interface IChangelogUpdateInput {
  /** Entry id to update */
  id: string;
  /** Updated title */
  title?: string;
  /** Updated markdown content */
  markdownDetails?: string;
  /** Updated types (new, improved, fixed) */
  types?: string[];
  /** Updated post IDs to link */
  postIDs?: string[];
  /** Whether to mark as published (true) or draft (false) */
  publish?: boolean;
  /** Updated release date (ISO 8601) */
  releaseDate?: string | null;
}

/**
 * Changelog list query parameters
 */
export interface IChangelogListParams {
  /** Number to return */
  limit?: number;
  /** Skip for pagination */
  skip?: number;
  /** Filter by label IDs */
  labelIDs?: string[];
  /** Filter by type */
  type?: string;
  /** Filter by published status */
  published?: boolean;
}
