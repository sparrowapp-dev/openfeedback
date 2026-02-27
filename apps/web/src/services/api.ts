import type { 
  IPost, 
  IBoard, 
  IUser, 
  IVote, 
  IComment, 
  ICategory,
  IPostCreateInput,
  IUserCreateInput,
  IVoteCreateInput,
  ICommentCreateInput,
  PostStatus,
  IChangelog,
  IChangelogCreateInput,
  IChangelogListParams,
  IChangelogUpdateInput,
} from '@openfeedback/shared';
import { useAuthStore } from '../stores/authStore';

export interface OpenFeedbackConfig {
  apiUrl: string;
  apiKey: string;
}

let config: OpenFeedbackConfig | null = null;

/**
 * HTTP client for making requests with various methods
 */
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    method: string,
    endpoint: string,
    data?: object,
    options?: { headers?: Record<string, string> }
  ): Promise<{ data: T }> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);
    const responseData = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: responseData,
        },
      };
    }

    return { data: responseData };
  }

  async get<T>(endpoint: string, options?: { headers?: Record<string, string> }): Promise<{ data: T }> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: object, options?: { headers?: Record<string, string> }): Promise<{ data: T }> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: object, options?: { headers?: Record<string, string> }): Promise<{ data: T }> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: { headers?: Record<string, string> }): Promise<{ data: T }> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// Export a singleton instance
export const api = new HttpClient(import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1');

/**
 * Initialize the OpenFeedback API client
 */
export function initOpenFeedback(options: OpenFeedbackConfig): void {
  config = options;
}

/**
 * Get current configuration
 */
export function getConfig(): OpenFeedbackConfig {
  if (!config) {
    throw new Error('OpenFeedback not initialized. Call initOpenFeedback() with your API key for 3rd party usage.');
  }
  return config;
}

/**
 * Make an API request
 * For authenticated users (logged in), use JWT token
 * For guest users or 3rd party, use API key
 */
async function apiRequest<T>(endpoint: string, body: object = {}): Promise<T> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Check if user is authenticated (has JWT token)
  const authState = useAuthStore.getState();
  const { accessToken, user } = authState;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // If user has JWT token, use it
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // If user has a subdomain, add it to headers (Fix for localhost multi-tenancy)
  if (user?.subdomain) {
    headers['x-company-subdomain'] = user.subdomain;
  }
  
  // Build request body
  const requestBody: any = { ...body };
  
  // Only add API key if not authenticated and config exists
  if (!accessToken && config) {
    requestBody.apiKey = config.apiKey;
  }
  
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ============ Boards API ============

export async function listBoards(): Promise<{ boards: IBoard[] }> {
  return apiRequest('/boards/list');
}

export async function retrieveBoard(id: string): Promise<IBoard> {
  return apiRequest('/boards/retrieve', { id });
}

// ============ Users API ============

export async function createOrUpdateUser(input: IUserCreateInput): Promise<{ id: string }> {
  return apiRequest('/users/create_or_update', input);
}

export async function retrieveUser(params: { id?: string; userID?: string; email?: string }): Promise<IUser> {
  return apiRequest('/users/retrieve', params);
}

// ============ Posts API ============

export interface ListPostsParams {
  boardID?: string;
  authorID?: string;
  ownerID?: string;
  categoryID?: string;
  tagIDs?: string[];
  status?: PostStatus;
  sort?: 'newest' | 'oldest' | 'score' | 'statusChanged' | 'trending';
  search?: string;
  limit?: number;
  skip?: number;
}

export async function listPosts(params: ListPostsParams = {}): Promise<{ hasMore: boolean; posts: IPost[] }> {
  return apiRequest('/posts/list', params);
}

export async function retrievePost(id: string): Promise<IPost> {
  return apiRequest('/posts/retrieve', { id });
}

export async function createPost(input: Omit<IPostCreateInput, 'boardID'> & { boardID: string }): Promise<IPost> {
  return apiRequest('/posts/create', input);
}

/**
 * Upload post response type
 */
export interface UploadPostResponse {
  isSuccessful: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    imageUrls: string[];
    post: IPost;
  };
}

/**
 * Upload post input with files
 */
export interface UploadPostInput {
  files?: File[];
  title: string;
  description?: string;
  boardID: string;
  authorID?: string;
  email?: string;
  categoryID?: string;
  category?: string;
  type?: string;
  subCategory?: string;
}

/**
 * Create a post with file uploads using multipart/form-data
 */
export async function uploadPost(input: UploadPostInput): Promise<UploadPostResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Check if user is authenticated (has JWT token)
  const authState = useAuthStore.getState();
  const { accessToken, user } = authState;
  
  const headers: Record<string, string> = {};
  
  // If user has JWT token, use it
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // If user has a subdomain, add it to headers (Fix for localhost multi-tenancy)
  if (user?.subdomain) {
    headers['x-company-subdomain'] = user.subdomain;
  }
  
  // Build FormData
  const formData = new FormData();
  
  // Append files
  if (input.files && input.files.length > 0) {
    input.files.forEach((file) => {
      formData.append('files', file);
    });
  }
  
  // Append required fields
  formData.append('title', input.title);
  formData.append('boardID', input.boardID);
  
  // Append optional fields
  if (input.description) {
    formData.append('description', input.description);
  }
  if (input.authorID) {
    formData.append('authorID', input.authorID);
  }
  if (input.email) {
    formData.append('email', input.email);
  }
  if (input.categoryID) {
    formData.append('categoryID', input.categoryID);
  }
  if (input.category) {
    formData.append('category', input.category);
  }
  if (input.type) {
    formData.append('type', input.type);
  }
  if (input.subCategory) {
    formData.append('subCategory', input.subCategory);
  }
  
  const response = await fetch(`${apiUrl}/posts/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload post');
  }

  return data;
}

export async function updatePost(postID: string, changes: Partial<IPost>): Promise<IPost> {
  return apiRequest('/posts/update', { postID, ...changes });
}

export async function changePostStatus(postID: string, status: PostStatus, changerID?: string): Promise<IPost> {
  return apiRequest('/posts/change_status', { postID, status, changerID });
}

// ============ Changelog API ============

export async function listChangelog(
  params: IChangelogListParams = {}
): Promise<{ hasMore: boolean; entries: IChangelog[] }> {
  return apiRequest('/entries/list', params);
}

export async function retrieveChangelog(id: string): Promise<IChangelog> {
  return apiRequest('/entries/retrieve', { id });
}

export async function createChangelogEntry(
  input: IChangelogCreateInput & { postIDs?: string[] }
): Promise<IChangelog> {
  const payload = {
    title: input.title,
    details: input.markdownDetails,
    labels: input.labels,
    types: input.types,
    postIDs: input.postIDs,
    notify: input.publish,
  };

  return apiRequest('/entries/create', payload);
}

export async function updateChangelogEntry(
  input: IChangelogUpdateInput
): Promise<IChangelog> {
  const payload: any = {
    id: input.id,
  };

  if (typeof input.title === 'string') {
    payload.title = input.title;
  }
  if (typeof input.markdownDetails === 'string') {
    payload.details = input.markdownDetails;
  }
  if (input.labels) {
    payload.labels = input.labels;
  }
  if (input.types) {
    payload.types = input.types;
  }
  if (input.postIDs) {
    payload.postIDs = input.postIDs;
  }
  if (typeof input.publish === 'boolean') {
    payload.publish = input.publish;
  }

  return apiRequest('/entries/update', payload);
}

export async function deleteChangelogEntry(id: string): Promise<string> {
  return apiRequest('/entries/delete', { id });
}

// ============ Votes API ============

export async function createVote(input: IVoteCreateInput): Promise<IVote> {
  return apiRequest('/votes/create', input);
}

export async function deleteVote(postID: string, voterID: string): Promise<string> {
  return apiRequest('/votes/delete', { postID, voterID });
}

export async function listVotes(params: { postID?: string; userID?: string }): Promise<{ hasMore: boolean; votes: IVote[] }> {
  return apiRequest('/votes/list', params);
}

// ============ Comments API ============

export async function listComments(params: { postID: string; limit?: number; skip?: number }): Promise<{ hasMore: boolean; comments: IComment[] }> {
  return apiRequest('/comments/list', params);
}

export async function createComment(input: ICommentCreateInput): Promise<IComment> {
  return apiRequest('/comments/create', input);
}

/**
 * Upload comment response type
 */
export interface UploadCommentResponse {
  isSuccessful: boolean;
  message: string;
  data: {
    id: string;
    imageUrls: string[];
    comment: IComment;
  };
}

/**
 * Upload comment input with files
 */
export interface UploadCommentInput {
  files?: File[];
  postID: string;
  value: string;
  parentID?: string;
  authorID?: string;
  email?: string;
}

/**
 * Create a comment with file uploads using multipart/form-data
 */
export async function uploadComment(input: UploadCommentInput): Promise<UploadCommentResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Check if user is authenticated (has JWT token)
  const authState = useAuthStore.getState();
  const { accessToken, user } = authState;
  
  const headers: Record<string, string> = {};
  
  // If user has JWT token, use it
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // If user has a subdomain, add it to headers (Fix for localhost multi-tenancy)
  if (user?.subdomain) {
    headers['x-company-subdomain'] = user.subdomain;
  }
  
  // Build FormData
  const formData = new FormData();
  
  // Append files
  if (input.files && input.files.length > 0) {
    input.files.forEach((file) => {
      formData.append('files', file);
    });
  }
  
  // Append required fields
  formData.append('postID', input.postID);
  formData.append('value', input.value);
  
  // Append optional fields
  if (input.parentID) {
    formData.append('parentID', input.parentID);
  }
  if (input.authorID) {
    formData.append('authorID', input.authorID);
  }
  if (input.email) {
    formData.append('email', input.email);
  }
  
  const response = await fetch(`${apiUrl}/comments/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload comment');
  }

  return data;
}

// ============ Categories API ============

export async function listCategories(boardID: string): Promise<{ categories: ICategory[] }> {
  return apiRequest('/categories/list', { boardID });
}

export async function createCategory(boardID: string, name: string): Promise<ICategory> {
  return apiRequest('/categories/create', { boardID, name });
}

export async function deleteCategory(id: string): Promise<string> {
  return apiRequest('/categories/delete', { id });
}
