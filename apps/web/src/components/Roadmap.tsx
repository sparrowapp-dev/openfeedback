import React, { useEffect, useMemo } from 'react';
import type { IPost, PostStatus } from '@openfeedback/shared';
import { useFeedbackStore } from '../stores/feedbackStore';
import { PostCard } from './PostCard';

export interface RoadmapProps {
  /** Board ID to display roadmap for */
  boardId: string;
  /** Statuses to show as columns */
  columns?: PostStatus[];
  /** Callback when a post is clicked */
  onPostClick?: (post: IPost) => void;
  /** Custom className */
  className?: string;
}

const DEFAULT_COLUMNS: PostStatus[] = ['planned', 'in progress', 'complete'];

const COLUMN_CONFIG: Record<PostStatus, { title: string; color: string }> = {
  open: { title: 'Open', color: 'of-bg-gray-100' },
  'under review': { title: 'Under Review', color: 'of-bg-amber-100' },
  planned: { title: 'Planned', color: 'of-bg-blue-100' },
  'in progress': { title: 'In Progress', color: 'of-bg-purple-100' },
  complete: { title: 'Complete', color: 'of-bg-green-100' },
  closed: { title: 'Closed', color: 'of-bg-gray-100' },
};

/**
 * Roadmap Component
 * 
 * Kanban-style roadmap showing posts grouped by status.
 * 
 * @example
 * ```tsx
 * <OpenFeedbackProvider apiUrl="..." apiKey="...">
 *   <Roadmap 
 *     boardId="abc123"
 *     columns={['planned', 'in progress', 'complete']}
 *     onPostClick={(post) => openDetail(post)}
 *   />
 * </OpenFeedbackProvider>
 * ```
 */
export function Roadmap({
  boardId,
  columns = DEFAULT_COLUMNS,
  onPostClick,
  className = '',
}: RoadmapProps) {
  const {
    posts,
    isLoadingPosts,
    fetchPosts,
    setCurrentBoard,
    boards,
  } = useFeedbackStore();

  // Initialize board
  useEffect(() => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setCurrentBoard(board);
    } else {
      fetchPosts(boardId, true);
    }
  }, [boardId, boards]);

  // Group posts by status
  const groupedPosts = useMemo(() => {
    const groups: Record<PostStatus, IPost[]> = {
      open: [],
      'under review': [],
      planned: [],
      'in progress': [],
      complete: [],
      closed: [],
    };

    posts.forEach((post) => {
      if (columns.includes(post.status)) {
        groups[post.status].push(post);
      }
    });

    return groups;
  }, [posts, columns]);

  if (isLoadingPosts && posts.length === 0) {
    return (
      <div className={`of-roadmap of-flex of-gap-4 of-p-4 of-overflow-x-auto ${className}`}>
        {columns.map((status) => (
          <div key={status} className="of-flex-shrink-0 of-w-80">
            <div className="of-animate-pulse">
              <div className="of-h-8 of-bg-gray-200 of-rounded of-mb-4" />
              <div className="of-space-y-3">
                <div className="of-h-24 of-bg-gray-100 of-rounded" />
                <div className="of-h-24 of-bg-gray-100 of-rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`of-roadmap of-flex of-gap-4 of-p-4 of-overflow-x-auto of-min-h-screen ${className}`}>
      {columns.map((status) => {
        const config = COLUMN_CONFIG[status];
        const columnPosts = groupedPosts[status];

        return (
          <div 
            key={status} 
            className="of-flex-shrink-0 of-w-80 of-flex of-flex-col"
          >
            {/* Column Header */}
            <div className={`of-px-3 of-py-2 of-rounded-lg of-mb-3 ${config.color}`}>
              <div className="of-flex of-items-center of-justify-between">
                <h3 className="of-font-semibold of-text-gray-800">{config.title}</h3>
                <span className="of-text-sm of-text-gray-600 of-font-medium">
                  {columnPosts.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="of-flex-1 of-space-y-3 of-overflow-y-auto">
              {columnPosts.length === 0 ? (
                <div className="of-text-center of-py-8 of-text-gray-400 of-text-sm">
                  No items
                </div>
              ) : (
                columnPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={onPostClick}
                    showStatus={false}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Roadmap;
