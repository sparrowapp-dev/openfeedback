import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import toast from 'react-hot-toast';

export interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (name: string, isPrivate: boolean) => Promise<void>;
}

/**
 * CreateBoardModal Component
 * 
 * Modal form for creating a new feedback board.
 */
export function CreateBoardModal({
  isOpen,
  onClose,
  onCreateBoard,
}: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Board name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateBoard(name.trim(), isPrivate);
      setName('');
      setIsPrivate(false);
      onClose();
      toast.success('Board created successfully!');
    } catch (err) {
      toast.error('Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setIsPrivate(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Board">
      <form onSubmit={handleSubmit}>
        <div className="of-space-y-4">
          <Input
            label="Board Name"
            placeholder="e.g., Feature Requests, Bug Reports"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />

          <label className="of-flex of-items-center of-gap-3 of-cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={isSubmitting}
              className="of-w-4 of-h-4 of-text-primary of-border-gray-300 of-rounded focus:of-ring-primary"
            />
            <div>
              <span className="of-text-sm of-font-medium of-text-gray-700">
                Make this board private
              </span>
              <p className="of-text-xs of-text-gray-500">
                Only team members can view private boards
              </p>
            </div>
          </label>
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
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
