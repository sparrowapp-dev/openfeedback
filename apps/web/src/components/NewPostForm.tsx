import React, { useState, useEffect } from 'react';
import { useOpenFeedback } from '../hooks/useOpenFeedback';
import { useFeedbackStore } from '../stores/feedbackStore';
import type { ICategory } from '@openfeedback/shared';
import * as api from '../services/api';

export interface NewPostFormProps {
  /** Board ID to create post on */
  boardId: string;
  /** Callback after successful post creation */
  onSuccess?: (postId: string) => void;
  /** Callback to close the form/modal */
  onCancel?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * NewPostForm Component
 * 
 * Form for creating new feedback posts.
 * 
 * @example
 * ```tsx
 * <NewPostForm 
 *   boardId="abc123"
 *   onSuccess={(id) => router.push(`/feedback/${id}`)}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */
export function NewPostForm({
  boardId,
  onSuccess,
  onCancel,
  className = '',
}: NewPostFormProps) {
  const { ensureUser, isGuest } = useOpenFeedback();
  const { createPost } = useFeedbackStore();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [categoryID, setCategoryID] = useState<string>('');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for this board
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await api.listCategories(boardId);
        setCategories(result.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, [boardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const authorID = await ensureUser();
      if (!authorID) {
        setError('Could not authenticate. Please try again.');
        return;
      }

      const post = await createPost({
        boardID: boardId,
        authorID,
        title: title.trim(),
        details: details.trim() || undefined,
        categoryID: categoryID || undefined,
      });

      onSuccess?.(post.id);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`of-new-post-form ${className}`}>
      <h2 className="of-text-lg of-font-semibold of-text-gray-900 of-mb-4">
        Share Your Feedback
      </h2>

      {/* Guest notice */}
      {isGuest && (
        <div className="of-mb-4 of-p-3 of-bg-blue-50 of-rounded-lg of-text-sm of-text-blue-700">
          <strong>Posting as Guest</strong> — Your feedback will be anonymous.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="of-mb-4 of-p-3 of-bg-red-50 of-rounded-lg of-text-sm of-text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="of-mb-4">
        <label htmlFor="of-post-title" className="of-block of-text-sm of-font-medium of-text-gray-700 of-mb-1">
          Title <span className="of-text-red-500">*</span>
        </label>
        <input
          id="of-post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short, descriptive title"
          maxLength={200}
          required
          className="of-w-full of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
        />
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="of-mb-4">
          <label htmlFor="of-post-category" className="of-block of-text-sm of-font-medium of-text-gray-700 of-mb-1">
            Category <span className="of-text-red-500">*</span>
          </label>
          <select
            id="of-post-category"
            value={categoryID}
            onChange={(e) => setCategoryID(e.target.value)}
            required
            className="of-w-full of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Details */}
      <div className="of-mb-4">
        <label htmlFor="of-post-details" className="of-block of-text-sm of-font-medium of-text-gray-700 of-mb-1">
          Details
        </label>
        <textarea
          id="of-post-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Describe your idea or issue in detail..."
          rows={5}
          className="of-w-full of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg of-resize-none focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
        />
      </div>

      {/* Actions */}
      <div className="of-flex of-justify-end of-gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="of-px-4 of-py-2 of-text-sm of-font-medium of-text-gray-700 of-bg-white of-border of-border-gray-200 of-rounded-lg hover:of-bg-gray-50 of-transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!title.trim() || (categories.length > 0 && !categoryID) || isSubmitting}
          className="of-px-4 of-py-2 of-text-sm of-font-medium of-text-white of-bg-primary of-rounded-lg hover:of-bg-primary-dark of-transition-colors disabled:of-opacity-50 disabled:of-cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}

export default NewPostForm;
