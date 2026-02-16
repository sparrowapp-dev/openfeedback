import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Modal, Spinner } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import type { ICategory } from '@openfeedback/shared';
import {
  ChevronLeftIcon,
  PlusIcon,
  TrashIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

export function BoardCategoriesPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      loadCategories();
    }
  }, [boardId]);

  const loadCategories = async () => {
    if (!boardId) return;
    setIsLoading(true);
    try {
      const result = await api.listCategories(boardId);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!boardId || !newCategoryName.trim()) return;
    
    setIsCreating(true);
    try {
      const category = await api.createCategory(boardId, newCategoryName.trim());
      setCategories([...categories, category]);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
      toast.success('Category created!');
    } catch (err) {
      console.error('Failed to create category:', err);
      toast.error('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Posts with this category will have it removed.')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      console.error('Failed to delete category:', err);
      toast.error('Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <Card className="of-text-center of-py-12">
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          Access Denied
        </h3>
        <p className="of-text-gray-600 of-mb-4">
          You need admin access to manage categories.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="of-space-y-6">
      {/* Header */}
      <div className="of-flex of-flex-col sm:of-flex-row of-items-start sm:of-items-center of-justify-between of-gap-4">
        <div className="of-flex of-items-center of-gap-3">
          <Link
            to={`/board/${boardId}`}
            className="of-p-2 of-rounded-lg hover:of-bg-gray-100 of-transition-colors"
          >
            <ChevronLeftIcon className="of-w-5 of-h-5 of-text-gray-600" />
          </Link>
          <div>
            <h1 className="of-text-2xl of-font-bold of-text-gray-900">
              Manage Categories
            </h1>
            <p className="of-text-gray-600 of-text-sm">
              Create and manage categories for this board
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowNewCategoryModal(true)}
          leftIcon={<PlusIcon className="of-w-5 of-h-5" />}
        >
          New Category
        </Button>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="of-flex of-justify-center of-py-12">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="of-text-center of-py-12">
          <div className="of-w-16 of-h-16 of-bg-gray-100 of-rounded-full of-flex of-items-center of-justify-center of-mx-auto of-mb-4">
            <TagIcon className="of-w-8 of-h-8 of-text-gray-400" />
          </div>
          <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
            No categories yet
          </h3>
          <p className="of-text-gray-600 of-mb-4">
            Create categories to help organize feedback posts.
          </p>
          <Button onClick={() => setShowNewCategoryModal(true)}>
            Create Category
          </Button>
        </Card>
      ) : (
        <div className="of-grid of-grid-cols-1 md:of-grid-cols-2 lg:of-grid-cols-3 of-gap-4">
          {categories.map((category) => (
            <Card key={category.id} padding="md">
              <div className="of-flex of-items-start of-justify-between">
                <div className="of-flex-1">
                  <div className="of-flex of-items-center of-gap-2 of-mb-1">
                    <TagIcon className="of-w-5 of-h-5 of-text-primary" />
                    <h3 className="of-font-semibold of-text-gray-900">
                      {category.name}
                    </h3>
                  </div>
                  <p className="of-text-sm of-text-gray-600">
                    {category.postCount} posts
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={deletingId === category.id}
                  className="of-p-2 of-text-gray-400 hover:of-text-red-600 hover:of-bg-red-50 of-rounded-lg of-transition-colors disabled:of-opacity-50"
                >
                  {deletingId === category.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <TrashIcon className="of-w-5 of-h-5" />
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Category Modal */}
      <Modal
        isOpen={showNewCategoryModal}
        onClose={() => {
          setShowNewCategoryModal(false);
          setNewCategoryName('');
        }}
        title="Create Category"
      >
        <div className="of-space-y-4">
          <div>
            <label htmlFor="category-name" className="of-block of-text-sm of-font-medium of-text-gray-700 of-mb-1">
              Category Name
            </label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Feature Request, Bug Report"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                }
              }}
            />
          </div>
          
          <div className="of-flex of-justify-end of-gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCategoryModal(false);
                setNewCategoryName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              isLoading={isCreating}
              disabled={!newCategoryName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
