import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useBoardsStore } from '../../stores/boardsStore';
import { Button, Card, CardTitle, CardDescription, Modal, Input, Spinner, Badge } from '../../components/ui';
import { PlusIcon, ChatBubbleLeftRightIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { IBoard } from '@/index';
export function DashboardPage() {
  const { user } = useAuthStore();
  const {  isLoading, fetchBoards, createBoard, boards: rawBoards } = useBoardsStore();
  
  // Ensure boards is always an array
  const boards = Array.isArray(rawBoards) ? rawBoards : [rawBoards].filter(Boolean);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    setIsCreating(true);
    try {
      await createBoard({ name: newBoardName });
      toast.success('Board created successfully!');
      setShowCreateModal(false);
      setNewBoardName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="of-space-y-6">
      {/* Welcome Section */}
      <div className="of-flex of-items-center of-justify-between">
        <div>
          <h1 className="of-text-2xl of-font-bold of-text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="of-text-gray-600 of-mt-1">
            Manage your feedback boards and track user requests.
          </p>
        </div>
        {user?.isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusIcon className="of-w-5 of-h-5" />}
          >
            Create Board
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="of-grid of-grid-cols-1 md:of-grid-cols-3 of-gap-4">
        <Card className="of-flex of-items-center of-gap-4">
          <div className="of-p-3 of-bg-primary/10 of-rounded-lg">
            <ChatBubbleLeftRightIcon className="of-w-6 of-h-6 of-text-primary" />
          </div>
          <div>
            <p className="of-text-2xl of-font-bold of-text-gray-900">{boards.length}</p>
            <p className="of-text-sm of-text-gray-600">Active Boards</p>
          </div>
        </Card>
        
        <Card className="of-flex of-items-center of-gap-4">
          <div className="of-p-3 of-bg-green-100 of-rounded-lg">
            <ChartBarIcon className="of-w-6 of-h-6 of-text-green-600" />
          </div>
          <div>
            <p className="of-text-2xl of-font-bold of-text-gray-900">--</p>
            <p className="of-text-sm of-text-gray-600">Total Feedback</p>
          </div>
        </Card>
        
        <Card className="of-flex of-items-center of-gap-4">
          <div className="of-p-3 of-bg-blue-100 of-rounded-lg">
            <Cog6ToothIcon className="of-w-6 of-h-6 of-text-blue-600" />
          </div>
          <div>
            <p className="of-text-2xl of-font-bold of-text-gray-900">--</p>
            <p className="of-text-sm of-text-gray-600">In Progress</p>
          </div>
        </Card>
      </div>

      {/* Boards Grid */}
      <div>
        <h2 className="of-text-lg of-font-semibold of-text-gray-900 of-mb-4">Your Boards</h2>
        
        {isLoading ? (
          <div className="of-flex of-justify-center of-py-12">
            <Spinner size="lg" />
          </div>
        ) : boards.length === 0 ? (
          <Card className="of-text-center of-py-12">
            <ChatBubbleLeftRightIcon className="of-w-12 of-h-12 of-text-gray-400 of-mx-auto of-mb-4" />
            <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
              No boards yet
            </h3>
            <p className="of-text-gray-600 of-mb-4">
              Create your first feedback board to start collecting user feedback.
            </p>
            {user?.isAdmin && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create your first board
              </Button>
            )}
          </Card>
        ) : (
          <div className="of-grid of-grid-cols-1 md:of-grid-cols-2 lg:of-grid-cols-3 of-gap-4">
            {boards.map((board) => (
              <Link key={board.id} to={`/board/${board.id}`}>
                <Card hoverable className="of-h-full">
                  <div className="of-flex of-items-start of-justify-between">
                    <div className="of-flex-1">
                      <CardTitle>{board.name}</CardTitle>
                      <CardDescription>
                        {board.postCount || 0} posts
                      </CardDescription>
                    </div>
                    {board.isPrivate && (
                      <Badge variant="default" size="sm">Private</Badge>
                    )}
                  </div>
                  <div className="of-mt-4 of-text-xs of-text-gray-400">
                    Created {new Date(board.created).toLocaleDateString()}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Board"
      >
        <div className="of-space-y-4">
          <Input
            label="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="e.g., Feature Requests, Bug Reports"
            autoFocus
          />
          <div className="of-flex of-gap-3 of-justify-end">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} isLoading={isCreating}>
              Create Board
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
