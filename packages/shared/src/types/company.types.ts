/**
 * Company interface - internal representation
 */
export interface ICompany {
  /** Internal ID */
  id: string;
  /** Company name */
  name: string;
  /** API key for authentication (hashed in storage) */
  apiKey: string;
  /** Allowed domains for widget embedding */
  domainWhitelist: string[];
  /** Creation date (ISO 8601) */
  created: string;
  /** Billing tier/plan */
  plan?: 'free' | 'starter' | 'growth' | 'business';
  /** Custom subdomain */
  subdomain?: string;
  /** Company logo URL */
  logoURL?: string;
}

/**
 * Input for company creation
 */
export interface ICompanyCreateInput {
  name: string;
  domainWhitelist?: string[];
  subdomain?: string;
}

/**
 * Internal company with sensitive fields
 */
export interface ICompanyInternal extends ICompany {
  /** Hashed API key */
  apiKeyHash: string;
  /** Plain API key (only returned on creation) */
  apiKeyPlain?: string;
}
