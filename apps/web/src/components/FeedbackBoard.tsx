import React, { useEffect, useState, useCallback } from 'react';
import type { IPost, PostStatus } from '@openfeedback/shared';
import { useFeedbackStore } from '../stores/feedbackStore';
import { useOpenFeedback } from '../hooks/useOpenFeedback';
import { PostCard } from './PostCard';

export interface FeedbackBoardProps {
  /** Board ID to display */
  boardId: string;
  /** Callback when a post is clicked */
  onPostClick?: (post: IPost) => void;
  /** Show search bar */
  showSearch?: boolean;
  /** Show status filter */
  showStatusFilter?: boolean;
  /** Show sort options */
  showSortOptions?: boolean;
  /** Show "New Post" button */
  showNewPostButton?: boolean;
  /** Callback for new post button */
  onNewPostClick?: () => void;
  /** Custom className */
  className?: string;
  /** Custom header content */
  header?: React.ReactNode;
}

const STATUS_OPTIONS: { value: PostStatus | null; label: string }[] = [
  { value: null, label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'under review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' },
];

const SORT_OPTIONS: { value: 'newest' | 'oldest' | 'score' | 'trending'; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'score', label: 'Top' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

/**
 * FeedbackBoard Component
 * 
 * Full-featured feedback board with posts list, filtering, sorting, and infinite scroll.
 * 
 * @example
 * ```tsx
 * <OpenFeedbackProvider apiUrl="..." apiKey="...">
 *   <FeedbackBoard 
 *     boardId="abc123"
 *     onPostClick={(post) => router.push(`/feedback/${post.id}`)}
 *     showNewPostButton
 *     onNewPostClick={() => setShowModal(true)}
 *   />
 * </OpenFeedbackProvider>
 * ```
 */
export function FeedbackBoard({
  boardId,
  onPostClick,
  showSearch = true,
  showStatusFilter = true,
  showSortOptions = true,
  showNewPostButton = true,
  onNewPostClick,
  className = '',
  header,
}: FeedbackBoardProps) {
  const { isUserLoading } = useOpenFeedback();
  const {
    posts,
    isLoadingPosts,
    hasMorePosts,
    statusFilter,
    sortBy,
    searchQuery,
    setCurrentBoard,
    fetchPosts,
    fetchMorePosts,
    setStatusFilter,
    setSortBy,
    setSearchQuery,
    boards,
  } = useFeedbackStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Set board on mount
  useEffect(() => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setCurrentBoard(board);
    } else {
      // Board not in cache, fetch posts directly
      fetchPosts(boardId, true);
    }
  }, [boardId, boards]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMorePosts && !isLoadingPosts) {
      fetchMorePosts();
    }
  }, [hasMorePosts, isLoadingPosts, fetchMorePosts]);

  return (
    <div className={`of-feedback-board of-flex of-flex-col of-h-full ${className}`}>
      {/* Header */}
      {header || (
        <div className="of-px-4 of-py-3 of-border-b of-border-gray-200 of-bg-white">
          <div className="of-flex of-items-center of-justify-between of-gap-4 of-flex-wrap">
            {/* Search */}
            {showSearch && (
              <div className="of-relative of-flex-1 of-min-w-[200px] of-max-w-md">
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="of-w-full of-pl-9 of-pr-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
                />
                <svg
                  className="of-absolute of-left-3 of-top-1/2 of--translate-y-1/2 of-w-4 of-h-4 of-text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}

            <div className="of-flex of-items-center of-gap-2">
              {/* Status Filter */}
              {showStatusFilter && (
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter((e.target.value || null) as PostStatus | null)}
                  className="of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg of-bg-white focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value || ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort */}
              {showSortOptions && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg of-bg-white focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* New Post Button */}
              {showNewPostButton && (
                <button
                  type="button"
                  onClick={onNewPostClick}
                  className="of-px-4 of-py-2 of-text-sm of-font-medium of-text-white of-bg-primary of-rounded-lg hover:of-bg-primary-dark of-transition-colors"
                >
                  New Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div 
        className="of-flex-1 of-overflow-y-auto of-p-4 of-space-y-3 of-bg-gray-50"
        onScroll={handleScroll}
      >
        {isLoadingPosts && posts.length === 0 ? (
          // Loading skeleton
          <div className="of-space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="of-animate-pulse of-flex of-gap-4 of-p-4 of-bg-white of-rounded-lg">
                <div className="of-w-12 of-h-16 of-bg-gray-200 of-rounded" />
                <div className="of-flex-1 of-space-y-2">
                  <div className="of-h-4 of-bg-gray-200 of-rounded of-w-3/4" />
                  <div className="of-h-3 of-bg-gray-200 of-rounded of-w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          // Empty state
          <div className="of-flex of-flex-col of-items-center of-justify-center of-py-12 of-text-center">
            <svg className="of-w-16 of-h-16 of-text-gray-300 of-mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="of-text-lg of-font-medium of-text-gray-900">No feedback yet</h3>
            <p className="of-mt-1 of-text-sm of-text-gray-500">Be the first to share your ideas!</p>
            {showNewPostButton && (
              <button
                type="button"
                onClick={onNewPostClick}
                className="of-mt-4 of-px-4 of-py-2 of-text-sm of-font-medium of-text-white of-bg-primary of-rounded-lg hover:of-bg-primary-dark of-transition-colors"
              >
                Create Post
              </button>
            )}
          </div>
        ) : (
          // Posts
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={onPostClick}
              />
            ))}
            
            {/* Loading more indicator */}
            {isLoadingPosts && (
              <div className="of-flex of-justify-center of-py-4">
                <div className="of-animate-spin of-w-6 of-h-6 of-border-2 of-border-primary of-border-t-transparent of-rounded-full" />
              </div>
            )}
            
            {/* End message */}
            {!hasMorePosts && posts.length > 0 && (
              <p className="of-text-center of-text-sm of-text-gray-400 of-py-4">
                You've reached the end
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackBoard;
