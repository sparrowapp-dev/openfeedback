import type { IPost } from '@openfeedback/shared';
import { PostCard } from '../PostCard';
import { Spinner, Button } from '../ui';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface PostListProps {
  posts: IPost[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPostClick?: (post: IPost) => void;
  onNewPostClick?: () => void;
  emptyMessage?: string;
  showStatus?: boolean;
}

/**
 * PostList Component
 * 
 * Displays a list of PostCards with loading, empty, and pagination states.
 */
export function PostList({
  posts,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onPostClick,
  onNewPostClick,
  emptyMessage = 'No posts yet',
  showStatus = true,
}: PostListProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="of-flex of-items-center of-justify-center of-py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="of-text-center of-py-12 of-bg-white of-rounded-lg of-border of-border-gray-200">
        <div className="of-w-16 of-h-16 of-bg-gray-100 of-rounded-full of-flex of-items-center of-justify-center of-mx-auto of-mb-4">
          <FunnelIcon className="of-w-8 of-h-8 of-text-gray-400" />
        </div>
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          {emptyMessage}
        </h3>
        <p className="of-text-gray-500 of-mb-4">
          Be the first to share your ideas and feedback
        </p>
        {onNewPostClick && (
          <Button onClick={onNewPostClick}>
            <PlusIcon className="of-w-4 of-h-4 of-mr-2" />
            Submit Feedback
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="of-space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => onPostClick?.(post)}
          showStatus={showStatus}
        />
      ))}
      
      {hasMore && onLoadMore && (
        <div className="of-flex of-justify-center of-pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            isLoading={isLoading}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
