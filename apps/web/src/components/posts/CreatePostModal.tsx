import { useState } from 'react';
import { Modal, Button, Input, Textarea } from '../ui';
import toast from 'react-hot-toast';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (title: string, details: string) => Promise<void>;
  boardName?: string;
}

/**
 * CreatePostModal Component
 * 
 * Modal form for creating a new feedback post.
 */
export function CreatePostModal({
  isOpen,
  onClose,
  onCreatePost,
  boardName,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreatePost(title.trim(), details.trim());
      setTitle('');
      setDetails('');
      onClose();
      toast.success('Feedback submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setDetails('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={boardName ? `Submit Feedback to ${boardName}` : 'Submit Feedback'}
    >
      <form onSubmit={handleSubmit}>
        <div className="of-space-y-4">
          <Input
            label="Title"
            placeholder="Short, descriptive title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            maxLength={500}
            autoFocus
          />

          <Textarea
            label="Details (optional)"
            placeholder="Describe your idea or feedback in detail..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={isSubmitting}
            rows={5}
            maxLength={50000}
          />
          
          <p className="of-text-xs of-text-gray-500">
            Be clear and concise. Include any relevant context or examples.
          </p>
        </div>

        <div className="of-flex of-justify-end of-gap-3 of-mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
