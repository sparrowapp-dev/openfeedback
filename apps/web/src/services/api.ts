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
  PostStatus 
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
  const { accessToken } = authState;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // If user has JWT token, use it
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
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
  limit?: number;
  skip?: number;
  sort?: 'newest' | 'oldest' | 'score' | 'statusChanged' | 'trending';
  status?: PostStatus;
  search?: string;
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

export async function updatePost(postID: string, changes: Partial<IPost>): Promise<IPost> {
  return apiRequest('/posts/update', { postID, ...changes });
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

// ============ Categories API ============

export async function listCategories(boardID: string): Promise<{ categories: ICategory[] }> {
  return apiRequest('/categories/list', { boardID });
}
