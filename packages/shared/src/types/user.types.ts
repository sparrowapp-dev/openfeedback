/**
 * User interface - API v1 response structure
 */
export interface IUser {
  /** Internal OpenFeedback ID (MongoDB ObjectID) */
  id: string;
  /** Display alias for anonymous users */
  alias?: string;
  /** User avatar URL */
  avatarURL?: string;
  /** Companies the user belongs to */
  companies?: IUserCompany[];
  /** Account creation date (ISO 8601) */
  created: string;
  /** Custom fields dictionary */
  customFields?: Record<string, string | number | boolean>;
  /** User email (nullable for shadow/guest users) */
  email?: string | null;
  /** Whether user is an admin */
  isAdmin: boolean;
  /** Last activity timestamp (ISO 8601) */
  lastActivity?: string;
  /** Display name */
  name: string;
  /** Profile URL */
  url: string;
  /** External user ID (client's system ID) */
  userID?: string;
}

export interface IUserCompany {
  id: string;
  name: string;
  monthlySpend?: number;
  created?: string;
  customFields?: Record<string, string | number | boolean>;
}

/**
 * Input for user creation/update
 */
export interface IUserCreateInput {
  /** External user ID from client's system */
  userID: string;
  /** Display name */
  name: string;
  /** Email (optional - omit for guest/shadow users) */
  email?: string | null;
  /** Avatar URL */
  avatarURL?: string;
  /** Custom fields */
  customFields?: Record<string, string | number | boolean>;
  /** Companies data */
  companies?: IUserCompany[];
}

/**
 * Internal user fields (includes shadow user tracking)
 */
export interface IUserInternal extends IUser {
  /** Company this user belongs to */
  companyID: string;
  /** Shadow user flag (guest accounts without email) */
  isShadow: boolean;
}
