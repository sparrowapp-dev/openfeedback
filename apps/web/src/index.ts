// OpenFeedback - Embeddable React Components
// Library entry point for npm package

// Styles
import './styles/globals.css';

// Components
export {
  VoteButton,
  StatusBadge,
  PostCard,
  FeedbackBoard,
  Roadmap,
  CommentThread,
  NewPostForm,
  type VoteButtonProps,
  type StatusBadgeProps,
  type PostCardProps,
  type FeedbackBoardProps,
  type RoadmapProps,
  type CommentThreadProps,
  type NewPostFormProps,
} from './components';

// Hooks
export {
  useShadowUser,
  OpenFeedbackProvider,
  useOpenFeedback,
  type OpenFeedbackProviderProps,
} from './hooks';

// Store
export { useFeedbackStore } from './stores/feedbackStore';

// API Service
export {
  initOpenFeedback,
  getConfig,
  listBoards,
  retrieveBoard,
  createOrUpdateUser,
  retrieveUser,
  listPosts,
  retrievePost,
  createPost,
  updatePost,
  changePostStatus,
  createVote,
  deleteVote,
  listVotes,
  listComments,
  createComment,
  listCategories,
  createCategory,
  deleteCategory,
  type OpenFeedbackConfig,
  type ListPostsParams,
} from './services/api';

// Re-export shared types
export type {
  IUser,
  IUserCreateInput,
  IBoard,
  IBoardCreateInput,
  IPost,
  IPostCreateInput,
  IPostListParams,
  PostStatus,
  IVote,
  IVoteCreateInput,
  IComment,
  ICommentCreateInput,
  ICategory,
  ICategoryCreateInput,
  ITag,
  ITagCreateInput,
  IChangelog,
  IChangelogCreateInput,
  ICompany,
  ISkipPaginatedResponse as IPaginatedResponse,
  ICursorPaginatedResponse,
} from '@openfeedback/shared';
