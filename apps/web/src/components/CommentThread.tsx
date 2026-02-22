import React, { useState, useEffect, useRef } from 'react';
import type { IComment } from '@openfeedback/shared';
import { listComments, uploadComment } from '../services/api';
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
 * Displays comments for a post with ability to add new comments with optional image attachments.
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Limit to 10 files
    const limitedFiles = imageFiles.slice(0, 10 - selectedFiles.length);
    
    // Create preview URLs
    const newPreviewUrls = limitedFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...limitedFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

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

      const response = await uploadComment({
        postID: postId,
        authorID,
        value: newComment.trim(),
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      setComments((prev) => [...prev, response.data.comment]);
      setNewComment('');
      // Clear files
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
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
                {/* Comment Images */}
                {comment.imageURLs && comment.imageURLs.length > 0 && (
                  <div className="of-mt-2 of-flex of-flex-wrap of-gap-2">
                    {comment.imageURLs.map((url, index) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="of-block"
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="of-max-w-[200px] of-max-h-[150px] of-object-cover of-rounded-lg of-border of-border-gray-200 hover:of-opacity-90 of-transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
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
          
          {/* File Upload */}
          <div className="of-mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="of-hidden"
              id="of-comment-file-upload"
            />
            <label
              htmlFor="of-comment-file-upload"
              className="of-inline-flex of-items-center of-gap-1 of-px-3 of-py-1.5 of-text-sm of-text-gray-600 of-bg-gray-100 of-rounded-lg of-cursor-pointer hover:of-bg-gray-200 of-transition-colors"
            >
              <svg className="of-w-4 of-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Attach Images
            </label>
          </div>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="of-mt-2 of-flex of-flex-wrap of-gap-2">
              {previewUrls.map((url, index) => (
                <div key={url} className="of-relative of-group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="of-w-16 of-h-16 of-object-cover of-rounded-lg of-border of-border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="of-absolute of-top-0.5 of-right-0.5 of-w-4 of-h-4 of-bg-red-500 of-text-white of-rounded-full of-flex of-items-center of-justify-center of-opacity-0 group-hover:of-opacity-100 of-transition-opacity"
                    aria-label="Remove image"
                  >
                    <svg className="of-w-2.5 of-h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

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
