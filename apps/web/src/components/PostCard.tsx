import React from 'react';
import type { IPost } from '@openfeedback/shared';
import { VoteButton } from './VoteButton';
import { StatusBadge } from './StatusBadge';

export interface PostCardProps {
  /** Post data */
  post: IPost;
  /** Whether current user has voted */
  hasVoted?: boolean;
  /** Callback when card is clicked */
  onClick?: (post: IPost) => void;
  /** Show status badge */
  showStatus?: boolean;
  /** Show category label */
  showCategory?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * PostCard Component
 * 
 * Displays a feedback post with title, details preview, vote button, and metadata.
 * 
 * @example
 * ```tsx
 * <PostCard 
 *   post={post} 
 *   onClick={(p) => openPostDetail(p.id)}
 *   showStatus
 * />
 * ```
 */
export function PostCard({
  post,
  hasVoted = false,
  onClick,
  showStatus = true,
  showCategory = true,
  className = '',
}: PostCardProps) {
  const handleClick = () => {
    onClick?.(post);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(post);
    }
  };

  // Truncate details for preview
  const detailsPreview = post.details 
    ? post.details.length > 150 
      ? post.details.substring(0, 150) + '...'
      : post.details
    : null;

  return (
    <article 
      className={`
        of-flex of-gap-4 of-p-4 of-bg-white of-rounded-lg of-border of-border-gray-200
        of-transition-shadow hover:of-shadow-md
        ${onClick ? 'of-cursor-pointer' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Vote Button */}
      <div className="of-flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <VoteButton postId={post.id} score={post.score} hasVoted={hasVoted} />
      </div>

      {/* Content */}
      <div className="of-flex-1 of-min-w-0">
        {/* Title */}
        <h3 className="of-text-base of-font-semibold of-text-gray-900 of-truncate">
          {post.title}
        </h3>

        {/* Details Preview */}
        {detailsPreview && (
          <p className="of-mt-1 of-text-sm of-text-gray-600 of-line-clamp-2">
            {detailsPreview}
          </p>
        )}

        {/* Metadata Row */}
        <div className="of-mt-2 of-flex of-flex-wrap of-items-center of-gap-2 of-text-xs of-text-gray-500">
          {/* Status */}
          {showStatus && <StatusBadge status={post.status} />}

          {/* Category */}
          {showCategory && post.category && (
            <span className="of-px-2 of-py-0.5 of-bg-gray-100 of-rounded of-text-gray-600">
              {post.category.name}
            </span>
          )}

          {/* Comment Count */}
          <span className="of-flex of-items-center of-gap-1">
            <svg className="of-w-3.5 of-h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.commentCount}
          </span>

          {/* Time */}
          <span>
            {new Date(post.created).toLocaleDateString()}
          </span>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
