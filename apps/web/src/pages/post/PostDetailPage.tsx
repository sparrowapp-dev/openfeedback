import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { useOpenFeedback } from '../../hooks/useOpenFeedback';
import { Button, Card, Textarea, Spinner, Avatar, Badge, Select } from '../../components/ui';
import { StatusBadge } from '../../components/StatusBadge';
import { VoteButton } from '../../components/VoteButton';
import type { PostStatus, IComment } from '@openfeedback/shared';
import {
  ChevronLeftIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'under review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' },
];

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { ensureUser, isGuest, isUserLoading } = useOpenFeedback();
  const { currentPost, isLoadingPost, userVotes, fetchPost, fetchUserVotes, votePost, unvotePost } = useFeedbackStore();
  
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<PostStatus>('open');

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
      loadComments();
    }
  }, [postId]);

  // Fetch user votes when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUserVotes(user.id);
    }
  }, [user?.id, fetchUserVotes]);

  useEffect(() => {
    if (currentPost) {
      setNewStatus(currentPost.status);
    }
  }, [currentPost]);

  const loadComments = async () => {
    if (!postId) return;
    
    setIsLoadingComments(true);
    try {
      const result = await api.listComments({ postID: postId });
      setComments(result.comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !postId) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      // Get user ID (either authenticated user or guest)
      const authorID = await ensureUser();
      if (!authorID) {
        toast.error('Could not create user. Please try again.');
        return;
      }

      const comment = await api.createComment({
        postID: postId,
        authorID: authorID,
        value: newComment,
      });
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (err) {
      console.error('Comment submission error:', err);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleVote = async () => {
    if (!isAuthenticated || !user || !postId) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      await votePost(postId, user.id);
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handleStatusUpdate = async () => {
    if (!postId || !user?.isAdmin) return;
    
    try {
      await api.updatePost(postId, { status: newStatus });
      fetchPost(postId);
      setIsEditingStatus(false);
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoadingPost && !currentPost) {
    return (
      <div className="of-flex of-justify-center of-py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentPost) {
    return (
      <Card className="of-text-center of-py-12">
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          Post not found
        </h3>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="of-max-w-3xl of-mx-auto of-space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="of-flex of-items-center of-gap-2 of-text-gray-600 hover:of-text-gray-900"
      >
        <ChevronLeftIcon className="of-w-5 of-h-5" />
        Back
      </button>

      {/* Post Card */}
      <Card>
        <div className="of-flex of-gap-4">
          {/* Vote Section */}
          <div className="of-flex of-flex-col of-items-center">
            <VoteButton
              postId={currentPost.id}
              score={currentPost.score}
              hasVoted={userVotes.has(currentPost.id)}
              onVoteChange={() => fetchPost(postId!)}
            />
          </div>

          {/* Content */}
          <div className="of-flex-1 of-min-w-0">
            <div className="of-flex of-items-start of-justify-between of-gap-4">
              <h1 className="of-text-xl of-font-bold of-text-gray-900">
                {currentPost.title}
              </h1>
              <StatusBadge status={currentPost.status} />
            </div>

            {currentPost.details && (
              <p className="of-mt-4 of-text-gray-700 of-whitespace-pre-wrap">
                {currentPost.details}
              </p>
            )}

            {/* Meta */}
            <div className="of-mt-4 of-flex of-items-center of-gap-4 of-text-sm of-text-gray-500">
              <div className="of-flex of-items-center of-gap-1">
                {currentPost.author && (
                  <>
                    <Avatar
                      name={currentPost.author.name}
                      src={currentPost.author.avatarURL}
                      size="xs"
                    />
                    <span>{currentPost.author.name}</span>
                  </>
                )}
              </div>
              <span>•</span>
              <span>{new Date(currentPost.created).toLocaleDateString()}</span>
              <span>•</span>
              <div className="of-flex of-items-center of-gap-1">
                <ChatBubbleLeftIcon className="of-w-4 of-h-4" />
                {currentPost.commentCount} comments
              </div>
            </div>

            {/* Admin Actions */}
            {user?.isAdmin && (
              <div className="of-mt-4 of-pt-4 of-border-t">
                <div className="of-flex of-items-center of-gap-2">
                  <span className="of-text-sm of-font-medium of-text-gray-700">Status:</span>
                  {isEditingStatus ? (
                    <div className="of-flex of-items-center of-gap-2">
                      <Select
                        value={newStatus}
                        onChange={(val) => setNewStatus(val as PostStatus)}
                        options={STATUS_OPTIONS}
                      />
                      <Button size="sm" onClick={handleStatusUpdate}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingStatus(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingStatus(true)}
                      leftIcon={<PencilIcon className="of-w-4 of-h-4" />}
                    >
                      Edit Status
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Comments Section */}
      <div className="of-space-y-4">
        <h2 className="of-text-lg of-font-semibold of-text-gray-900">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        <Card>
          {/* Guest notice */}
          {!isAuthenticated && (
            <div className="of-mb-4 of-p-3 of-bg-blue-50 of-rounded-lg of-text-sm of-text-blue-700">
              <strong>Commenting as Guest</strong> — Your comment will be anonymous.
            </div>
          )}
          
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="of-flex of-justify-end of-mt-3">
            <Button
              onClick={handleSubmitComment}
              isLoading={isSubmittingComment}
              disabled={!newComment.trim() || isUserLoading}
            >
              Comment
            </Button>
          </div>
        </Card>

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="of-flex of-justify-center of-py-8">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <Card className="of-text-center of-py-8">
            <ChatBubbleLeftIcon className="of-w-8 of-h-8 of-text-gray-400 of-mx-auto of-mb-2" />
            <p className="of-text-gray-600">No comments yet. Be the first!</p>
          </Card>
        ) : (
          <div className="of-space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} padding="sm">
                <div className="of-flex of-gap-3">
                  <Avatar
                    name={comment.author?.name || 'User'}
                    src={comment.author?.avatarURL}
                    size="sm"
                  />
                  <div className="of-flex-1 of-min-w-0">
                    <div className="of-flex of-items-center of-gap-2">
                      <span className="of-font-medium of-text-gray-900">
                        {comment.author?.name || 'Anonymous'}
                      </span>
                      {comment.internal && (
                        <Badge variant="warning" size="sm">Internal</Badge>
                      )}
                      <span className="of-text-xs of-text-gray-500">
                        {new Date(comment.created).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="of-mt-1 of-text-gray-700 of-text-sm of-whitespace-pre-wrap">
                      {comment.value}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
