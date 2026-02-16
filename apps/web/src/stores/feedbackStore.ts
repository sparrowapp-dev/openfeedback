import { create } from 'zustand';
import type { IPost, IBoard, IUser, ICategory, PostStatus } from '@openfeedback/shared';
import * as api from '../services/api';

interface FeedbackState {
  // Data
  boards: IBoard[];
  posts: IPost[];
  categories: ICategory[];
  currentBoard: IBoard | null;
  currentPost: IPost | null;
  currentUser: IUser | null;
  
  // User voting state
  userVotes: Set<string>; // Set of post IDs the current user has voted on
  
  // Loading states
  isLoadingBoards: boolean;
  isLoadingPosts: boolean;
  isLoadingPost: boolean;
  
  // Pagination
  hasMorePosts: boolean;
  postsSkip: number;
  
  // Filters
  statusFilter: PostStatus | null;
  categoryFilter: string | null;
  sortBy: 'newest' | 'oldest' | 'score' | 'trending';
  searchQuery: string;
  
  // Actions
  fetchBoards: () => Promise<void>;
  fetchPosts: (boardID?: string, reset?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  fetchCategories: (boardID: string) => Promise<void>;
  fetchUserVotes: (userID: string) => Promise<void>;
  setCurrentBoard: (board: IBoard | null) => void;
  setCurrentUser: (user: IUser | null) => void;
  setStatusFilter: (status: PostStatus | null) => void;
  setCategoryFilter: (categoryId: string | null) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'score' | 'trending') => void;
  setSearchQuery: (query: string) => void;
  
  // Mutations
  createPost: (input: { boardID: string; authorID: string; title: string; details?: string; categoryID?: string }) => Promise<IPost>;
  votePost: (postID: string, voterID: string) => Promise<void>;
  unvotePost: (postID: string, voterID: string) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // Initial state
  boards: [],
  posts: [],
  categories: [],
  currentBoard: null,
  currentPost: null,
  currentUser: null,
  userVotes: new Set<string>(),
  isLoadingBoards: false,
  isLoadingPosts: false,
  isLoadingPost: false,
  hasMorePosts: true,
  postsSkip: 0,
  statusFilter: null,
  categoryFilter: null,
  sortBy: 'newest',
  searchQuery: '',

  // Fetch boards
  fetchBoards: async () => {
    set({ isLoadingBoards: true });
    try {
      const { boards } = await api.listBoards();
      set({ boards, isLoadingBoards: false });
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      set({ isLoadingBoards: false });
    }
  },

  // Fetch posts with filtering
  fetchPosts: async (boardID?: string, reset = true) => {
    const state = get();
    if (reset) {
      set({ isLoadingPosts: true, postsSkip: 0 });
    }
    
    try {
      const { posts, hasMore } = await api.listPosts({
        boardID: boardID || state.currentBoard?.id,
        limit: 20,
        skip: reset ? 0 : state.postsSkip,
        sort: state.sortBy,
        status: state.statusFilter || undefined,
        categoryID: state.categoryFilter || undefined,
        search: state.searchQuery || undefined,
      });
      
      set({
        posts: reset ? posts : [...state.posts, ...posts],
        hasMorePosts: hasMore,
        postsSkip: reset ? 20 : state.postsSkip + 20,
        isLoadingPosts: false,
      });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoadingPosts: false });
    }
  },

  // Fetch more posts (infinite scroll)
  fetchMorePosts: async () => {
    const state = get();
    if (!state.hasMorePosts || state.isLoadingPosts) return;
    await state.fetchPosts(state.currentBoard?.id, false);
  },

  // Fetch single post
  fetchPost: async (id: string) => {
    set({ isLoadingPost: true });
    try {
      const post = await api.retrievePost(id);
      set({ currentPost: post, isLoadingPost: false });
    } catch (error) {
      console.error('Failed to fetch post:', error);
      set({ isLoadingPost: false });
    }
  },

  // Fetch categories for a board
  fetchCategories: async (boardID: string) => {
    try {
      const { categories } = await api.listCategories(boardID);
      set({ categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  // Fetch user votes
  fetchUserVotes: async (userID: string) => {
    try {
      const { votes } = await api.listVotes({ userID });
      const votedPostIds = new Set(votes.map(v => v.post?.id).filter(Boolean) as string[]);
      set({ userVotes: votedPostIds });
    } catch (error) {
      console.error('Failed to fetch user votes:', error);
    }
  },

  // Set current board
  setCurrentBoard: (board) => {
    set({ currentBoard: board, posts: [], postsSkip: 0, hasMorePosts: true });
    if (board) {
      get().fetchPosts(board.id);
      get().fetchCategories(board.id);
    }
  },

  // Set current user
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  // Set status filter
  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().fetchPosts(undefined, true);
  },

  // Set category filter
  setCategoryFilter: (categoryId) => {
    set({ categoryFilter: categoryId });
    get().fetchPosts(undefined, true);
  },

  // Set sort
  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().fetchPosts(undefined, true);
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchPosts(undefined, true);
  },

  // Create a new post
  createPost: async (input) => {
    const post = await api.createPost(input);
    set((state) => ({ posts: [post, ...state.posts] }));
    return post;
  },

  // Vote on a post
  votePost: async (postID, voterID) => {
    await api.createVote({ postID, voterID });
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postID ? { ...p, score: p.score + 1 } : p
      ),
      currentPost: state.currentPost?.id === postID 
        ? { ...state.currentPost, score: state.currentPost.score + 1 }
        : state.currentPost,
      userVotes: new Set(state.userVotes).add(postID),
    }));
  },

  // Unvote a post
  unvotePost: async (postID, voterID) => {
    await api.deleteVote(postID, voterID);
    // Optimistic update
    set((state) => {
      const newVotes = new Set(state.userVotes);
      newVotes.delete(postID);
      return {
        posts: state.posts.map((p) =>
          p.id === postID ? { ...p, score: Math.max(0, p.score - 1) } : p
        ),
        currentPost: state.currentPost?.id === postID 
          ? { ...state.currentPost, score: Math.max(0, state.currentPost.score - 1) }
          : state.currentPost,
        userVotes: newVotes,
      };
    });
  },
}));
