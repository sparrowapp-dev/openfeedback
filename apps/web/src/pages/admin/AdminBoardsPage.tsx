import { useEffect, useState } from 'react';
import { useBoardsStore, CreateBoardData } from '../../stores/boardsStore';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardTitle, Input, Modal, Spinner, Badge } from '../../components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function AdminBoardsPage() {
  const { user } = useAuthStore();
  const { boards, isLoading, fetchBoards, createBoard, updateBoard, deleteBoard } = useBoardsStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; isPrivate: boolean } | null>(null);
  const [newBoard, setNewBoard] = useState<CreateBoardData>({ name: '', isPrivate: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  if (!user?.isAdmin) {
    return (
      <Card className="of-text-center of-py-12">
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          Access Denied
        </h3>
        <p className="of-text-gray-600">
          You need admin privileges to access this page.
        </p>
      </Card>
    );
  }

  const handleCreate = async () => {
    if (!newBoard.name.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBoard(newBoard);
      toast.success('Board created successfully!');
      setShowCreateModal(false);
      setNewBoard({ name: '', isPrivate: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingBoard || !editingBoard.name.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBoard(editingBoard.id, {
        name: editingBoard.name,
        isPrivate: editingBoard.isPrivate,
      });
      toast.success('Board updated successfully!');
      setEditingBoard(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (boardId: string, boardName: string) => {
    if (!confirm(`Are you sure you want to delete "${boardName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteBoard(boardId);
      toast.success('Board deleted successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete board');
    }
  };

  return (
    <div className="of-space-y-6">
      {/* Header */}
      <div className="of-flex of-items-center of-justify-between">
        <div>
          <h1 className="of-text-2xl of-font-bold of-text-gray-900">
            Manage Boards
          </h1>
          <p className="of-text-gray-600 of-mt-1">
            Create and manage feedback boards for your organization.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          leftIcon={<PlusIcon className="of-w-5 of-h-5" />}
        >
          Create Board
        </Button>
      </div>

      {/* Boards Table */}
      <Card padding="none">
        {isLoading ? (
          <div className="of-flex of-justify-center of-py-12">
            <Spinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <div className="of-text-center of-py-12 of-px-4">
            <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
              No boards yet
            </h3>
            <p className="of-text-gray-600 of-mb-4">
              Create your first board to start collecting feedback.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Board
            </Button>
          </div>
        ) : (
          <div className="of-overflow-x-auto">
            <table className="of-w-full">
              <thead className="of-bg-gray-50">
                <tr>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Board Name
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Posts
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Visibility
                  </th>
                  <th className="of-px-6 of-py-3 of-text-left of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Created
                  </th>
                  <th className="of-px-6 of-py-3 of-text-right of-text-xs of-font-medium of-text-gray-500 of-uppercase of-tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="of-divide-y of-divide-gray-200">
                {boards.map((board) => (
                  <tr key={board.id} className="hover:of-bg-gray-50">
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap">
                      <div className="of-font-medium of-text-gray-900">{board.name}</div>
                      <div className="of-text-sm of-text-gray-500 of-font-mono">
                        {board.id}
                      </div>
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      {board.postCount || 0}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap">
                      {board.isPrivate ? (
                        <Badge variant="default" size="sm">
                          <EyeSlashIcon className="of-w-3 of-h-3 of-mr-1" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          <EyeIcon className="of-w-3 of-h-3 of-mr-1" />
                          Public
                        </Badge>
                      )}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-sm of-text-gray-500">
                      {new Date(board.created).toLocaleDateString()}
                    </td>
                    <td className="of-px-6 of-py-4 of-whitespace-nowrap of-text-right">
                      <div className="of-flex of-items-center of-justify-end of-gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingBoard({
                            id: board.id,
                            name: board.name,
                            isPrivate: board.isPrivate,
                          })}
                        >
                          <PencilIcon className="of-w-4 of-h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(board.id, board.name)}
                          className="of-text-red-600 hover:of-text-red-700"
                        >
                          <TrashIcon className="of-w-4 of-h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Board Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewBoard({ name: '', isPrivate: false });
        }}
        title="Create New Board"
      >
        <div className="of-space-y-4">
          <Input
            label="Board Name"
            value={newBoard.name}
            onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
            placeholder="e.g., Feature Requests"
            autoFocus
          />
          <label className="of-flex of-items-center of-gap-2">
            <input
              type="checkbox"
              checked={newBoard.isPrivate}
              onChange={(e) => setNewBoard({ ...newBoard, isPrivate: e.target.checked })}
              className="of-h-4 of-w-4 of-text-primary of-border-gray-300 of-rounded"
            />
            <span className="of-text-sm of-text-gray-700">
              Make this board private (only team members can view)
            </span>
          </label>
          <div className="of-flex of-justify-end of-gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Create Board
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Board Modal */}
      <Modal
        isOpen={!!editingBoard}
        onClose={() => setEditingBoard(null)}
        title="Edit Board"
      >
        {editingBoard && (
          <div className="of-space-y-4">
            <Input
              label="Board Name"
              value={editingBoard.name}
              onChange={(e) => setEditingBoard({ ...editingBoard, name: e.target.value })}
              autoFocus
            />
            <label className="of-flex of-items-center of-gap-2">
              <input
                type="checkbox"
                checked={editingBoard.isPrivate}
                onChange={(e) => setEditingBoard({ ...editingBoard, isPrivate: e.target.checked })}
                className="of-h-4 of-w-4 of-text-primary of-border-gray-300 of-rounded"
              />
              <span className="of-text-sm of-text-gray-700">
                Private board
              </span>
            </label>
            <div className="of-flex of-justify-end of-gap-3">
              <Button variant="outline" onClick={() => setEditingBoard(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
