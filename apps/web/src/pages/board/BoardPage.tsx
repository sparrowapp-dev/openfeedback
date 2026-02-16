import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, Input, Select, Spinner, Modal } from '../../components/ui';
import { PostCard } from '../../components/PostCard';
import { NewPostForm } from '../../components/NewPostForm';
import { StatusBadge } from '../../components/StatusBadge';
import type { PostStatus, IPost } from '@openfeedback/shared';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  MapIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'score', label: 'Most Votes' },
  { value: 'trending', label: 'Trending' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' },
];

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    currentBoard,
    posts,
    categories,
    isLoadingPosts,
    hasMorePosts,
    sortBy,
    statusFilter,
    categoryFilter,
    searchQuery,
    userVotes,
    fetchPosts,
    fetchMorePosts,
    fetchUserVotes,
    fetchCategories,
    setCurrentBoard,
    setSortBy,
    setStatusFilter,
    setCategoryFilter,
    setSearchQuery,
    votePost,
    unvotePost,
  } = useFeedbackStore();

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);

  useEffect(() => {
    if (boardId) {
      // Fetch board and posts
      fetchPosts(boardId, true);
      fetchCategories(boardId);
    }
  }, [boardId]);

  // Fetch user votes when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserVotes(user.id);
    }
  }, [user?.id, fetchUserVotes]);

  const handleVote = async (postId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      await votePost(postId, user.id);
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const handleUnvote = async (postId: string) => {
    if (!user) return;
    
    try {
      await unvotePost(postId, user.id);
    } catch (err) {
      toast.error('Failed to remove vote');
    }
  };

  return (
    <div className="of-space-y-6">
      {/* Header */}
      <div className="of-flex of-flex-col sm:of-flex-row of-items-start sm:of-items-center of-justify-between of-gap-4">
        <div className="of-flex of-items-center of-gap-3">
          <Link
            to="/dashboard"
            className="of-p-2 of-rounded-lg hover:of-bg-gray-100 of-transition-colors"
          >
            <ChevronLeftIcon className="of-w-5 of-h-5 of-text-gray-600" />
          </Link>
          <div>
            <h1 className="of-text-2xl of-font-bold of-text-gray-900">
              {currentBoard?.name || 'Feedback Board'}
            </h1>
            <p className="of-text-gray-600 of-text-sm">
              {posts.length} posts
            </p>
          </div>
        </div>
        
        <div className="of-flex of-items-center of-gap-2">
          <Link to={`/board/${boardId}/roadmap`}>
            <Button variant="outline" leftIcon={<MapIcon className="of-w-4 of-h-4" />}>
              Roadmap
            </Button>
          </Link>
          {user?.isAdmin && (
            <Link to={`/board/${boardId}/categories`}>
              <Button variant="outline" leftIcon={<TagIcon className="of-w-4 of-h-4" />}>
                Categories
              </Button>
            </Link>
          )}
          <Button
            onClick={() => setShowNewPostModal(true)}
            leftIcon={<PlusIcon className="of-w-5 of-h-5" />}
          >
            New Feedback
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="of-flex of-flex-col md:of-flex-row of-gap-3">
          <div className="of-flex-1">
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="of-w-5 of-h-5" />}
            />
          </div>
          <div className="of-flex of-gap-2">
            {categories.length > 0 && (
              <Select
                value={categoryFilter || ''}
                onChange={(val) => setCategoryFilter(val || null)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
              />
            )}
            <Select
              value={statusFilter || ''}
              onChange={(val) => setStatusFilter(val as PostStatus | null)}
              options={STATUS_OPTIONS}
            />
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as typeof sortBy)}
              options={SORT_OPTIONS}
            />
          </div>
        </div>
      </Card>

      {/* Posts List */}
      {isLoadingPosts && posts.length === 0 ? (
        <div className="of-flex of-justify-center of-py-12">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="of-text-center of-py-12">
          <div className="of-w-16 of-h-16 of-bg-gray-100 of-rounded-full of-flex of-items-center of-justify-center of-mx-auto of-mb-4">
            <FunnelIcon className="of-w-8 of-h-8 of-text-gray-400" />
          </div>
          <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
            No feedback yet
          </h3>
          <p className="of-text-gray-600 of-mb-4">
            Be the first to share your ideas and feedback!
          </p>
          <Button onClick={() => setShowNewPostModal(true)}>
            Submit Feedback
          </Button>
        </Card>
      ) : (
        <div className="of-space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              hasVoted={userVotes.has(post.id)}
              onClick={() => navigate(`/post/${post.id}`)}
              showStatus
            />
          ))}
          
          {hasMorePosts && (
            <div className="of-flex of-justify-center of-pt-4">
              <Button
                variant="outline"
                onClick={fetchMorePosts}
                isLoading={isLoadingPosts}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Post Modal */}
      <Modal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title="Submit Feedback"
        size="lg"
      >
        <NewPostForm
          boardId={boardId!}
          onSuccess={() => {
            setShowNewPostModal(false);
            toast.success('Feedback submitted!');
            fetchPosts(boardId!, true);
          }}
          onCancel={() => setShowNewPostModal(false)}
        />
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title={selectedPost?.title}
        size="lg"
      >
        {selectedPost && (
          <div className="of-space-y-4">
            <div className="of-flex of-items-center of-gap-2">
              <StatusBadge status={selectedPost.status} />
              <span className="of-text-sm of-text-gray-500">
                {selectedPost.score} votes
              </span>
            </div>
            <p className="of-text-gray-700 of-whitespace-pre-wrap">
              {selectedPost.details || 'No description provided.'}
            </p>
            <div className="of-text-sm of-text-gray-500">
              Posted on {new Date(selectedPost.created).toLocaleDateString()}
            </div>
            <div className="of-flex of-gap-2 of-pt-4 of-border-t">
              <Button onClick={() => handleVote(selectedPost.id)}>
                Upvote ({selectedPost.score})
              </Button>
              <Link to={`/post/${selectedPost.id}`}>
                <Button variant="outline">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
