import React, { useState, useEffect, useRef } from 'react';
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
 * Form for creating new feedback posts with optional image uploads.
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
  const { createPostWithFiles } = useFeedbackStore();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [categoryID, setCategoryID] = useState<string>('');
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const post = await createPostWithFiles({
        boardID: boardId,
        authorID,
        title: title.trim(),
        description: details.trim() || undefined,
        categoryID: categoryID || undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
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

      {/* Image Upload */}
      <div className="of-mb-4">
        <label className="of-block of-text-sm of-font-medium of-text-gray-700 of-mb-1">
          Attachments
        </label>
        <div className="of-border of-border-dashed of-border-gray-300 of-rounded-lg of-p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="of-hidden"
            id="of-file-upload"
          />
          <label
            htmlFor="of-file-upload"
            className="of-flex of-flex-col of-items-center of-justify-center of-cursor-pointer of-text-gray-500 hover:of-text-gray-700"
          >
            <svg className="of-w-8 of-h-8 of-mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="of-text-sm">Click to upload images</span>
            <span className="of-text-xs of-text-gray-400 of-mt-1">PNG, JPG, GIF up to 10MB (max 10 files)</span>
          </label>
        </div>

        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="of-mt-3 of-grid of-grid-cols-4 of-gap-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="of-relative of-group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="of-w-full of-h-20 of-object-cover of-rounded-lg of-border of-border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="of-absolute of-top-1 of-right-1 of-w-5 of-h-5 of-bg-red-500 of-text-white of-rounded-full of-flex of-items-center of-justify-center of-opacity-0 group-hover:of-opacity-100 of-transition-opacity"
                  aria-label="Remove image"
                >
                  <svg className="of-w-3 of-h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
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
