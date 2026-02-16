import React, { useState, useEffect } from 'react';
import type { IComment } from '@openfeedback/shared';
import { listComments, createComment } from '../services/api';
import { useOpenFeedback } from '../hooks/useOpenFeedback';

export interface CommentThreadProps {
  /** Post ID to show comments for */
  postId: string;
  /** Allow posting new comments */
  allowComments?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * CommentThread Component
 * 
 * Displays comments for a post with ability to add new comments.
 * 
 * @example
 * ```tsx
 * <CommentThread postId="abc123" allowComments />
 * ```
 */
export function CommentThread({
  postId,
  allowComments = true,
  className = '',
}: CommentThreadProps) {
  const { userId, ensureUser, isGuest } = useOpenFeedback();
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      try {
        const { comments: data } = await listComments({ postID: postId });
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchComments();
  }, [postId]);

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const authorID = await ensureUser();
      if (!authorID) {
        console.error('Could not get user ID');
        return;
      }

      const comment = await createComment({
        postID: postId,
        authorID,
        value: newComment.trim(),
      });

      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`of-comment-thread ${className}`}>
      {/* Comment Count */}
      <h4 className="of-text-sm of-font-semibold of-text-gray-700 of-mb-4">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h4>

      {/* Comments List */}
      {isLoading ? (
        <div className="of-space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="of-animate-pulse of-flex of-gap-3">
              <div className="of-w-8 of-h-8 of-bg-gray-200 of-rounded-full" />
              <div className="of-flex-1 of-space-y-2">
                <div className="of-h-3 of-bg-gray-200 of-rounded of-w-24" />
                <div className="of-h-4 of-bg-gray-200 of-rounded of-w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="of-text-sm of-text-gray-500 of-py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="of-space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="of-flex of-gap-3">
              {/* Avatar */}
              <div className="of-flex-shrink-0">
                {comment.author?.avatarURL ? (
                  <img 
                    src={comment.author.avatarURL} 
                    alt={comment.author.name || 'User'}
                    className="of-w-8 of-h-8 of-rounded-full of-object-cover"
                  />
                ) : (
                  <div className="of-w-8 of-h-8 of-rounded-full of-bg-gray-200 of-flex of-items-center of-justify-center of-text-gray-500 of-text-sm of-font-medium">
                    {(comment.author?.name || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="of-flex-1">
                <div className="of-flex of-items-center of-gap-2 of-mb-1">
                  <span className="of-text-sm of-font-medium of-text-gray-900">
                    {comment.author?.name || 'Guest'}
                  </span>
                  <span className="of-text-xs of-text-gray-400">
                    {new Date(comment.created).toLocaleDateString()}
                  </span>
                </div>
                <p className="of-text-sm of-text-gray-700 of-whitespace-pre-wrap">
                  {comment.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      {allowComments && (
        <form onSubmit={handleSubmit} className="of-mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isGuest ? 'Write a comment as guest...' : 'Write a comment...'}
            rows={3}
            className="of-w-full of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg of-resize-none focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
          />
          <div className="of-mt-2 of-flex of-justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="of-px-4 of-py-2 of-text-sm of-font-medium of-text-white of-bg-primary of-rounded-lg hover:of-bg-primary-dark of-transition-colors disabled:of-opacity-50 disabled:of-cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CommentThread;
