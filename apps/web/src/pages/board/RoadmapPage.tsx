import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { Button, Card, Spinner, Select } from '../../components/ui';
import { StatusBadge } from '../../components/StatusBadge';
import type { PostStatus, IPost, ICategory } from '@openfeedback/shared';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import * as api from '../../services/api';

const ROADMAP_COLUMNS: { status: PostStatus; label: string; color: string }[] = [
  { status: 'planned', label: 'Planned', color: 'of-bg-blue-500' },
  { status: 'in progress', label: 'In Progress', color: 'of-bg-yellow-500' },
  { status: 'complete', label: 'Complete', color: 'of-bg-green-500' },
];

export function RoadmapPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { posts, isLoadingPosts, fetchPosts, currentBoard } = useFeedbackStore();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (boardId) {
      fetchPosts(boardId, true);
      loadCategories();
    }
  }, [boardId]);

  const loadCategories = async () => {
    if (!boardId) return;
    try {
      const result = await api.listCategories(boardId);
      setCategories(result.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const getPostsByStatus = (status: PostStatus): IPost[] => {
    let filtered = posts.filter((p) => p.status === status);
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category?.id === selectedCategory);
    }
    return filtered;
  };

  if (isLoadingPosts && posts.length === 0) {
    return (
      <div className="of-flex of-justify-center of-py-12">
        <Spinner size="lg" />
      </div>
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
              Roadmap
            </h1>
            <p className="of-text-gray-600 of-text-sm">
              {currentBoard?.name || 'Feedback Board'}
            </p>
          </div>
        </div>
        
        <div className="of-flex of-items-center of-gap-3">
          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
            />
          )}
          
          <Link to={`/board/${boardId}`}>
            <Button variant="outline">
              Back to Board
            </Button>
          </Link>
        </div>
      </div>

      {/* Roadmap Columns */}
      <div className="of-grid of-grid-cols-1 md:of-grid-cols-3 of-gap-6">
        {ROADMAP_COLUMNS.map((column) => {
          const columnPosts = getPostsByStatus(column.status);
          
          return (
            <div key={column.status} className="of-space-y-3">
              {/* Column Header */}
              <div className="of-flex of-items-center of-gap-2">
                <div className={`of-w-3 of-h-3 of-rounded-full ${column.color}`} />
                <h2 className="of-font-semibold of-text-gray-900">{column.label}</h2>
                <span className="of-text-sm of-text-gray-500">
                  ({columnPosts.length})
                </span>
              </div>

              {/* Column Content */}
              <div className="of-space-y-3 of-min-h-[200px] of-bg-gray-50 of-rounded-lg of-p-3">
                {columnPosts.length === 0 ? (
                  <p className="of-text-sm of-text-gray-500 of-text-center of-py-8">
                    No items yet
                  </p>
                ) : (
                  columnPosts.map((post) => (
                    <Link key={post.id} to={`/post/${post.id}`}>
                      <Card hoverable padding="sm" className="of-bg-white">
                        <h3 className="of-font-medium of-text-gray-900 of-text-sm of-line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="of-flex of-items-center of-justify-between of-mt-2">
                          <span className="of-text-xs of-text-gray-500">
                            {post.score} votes
                          </span>
                          <span className="of-text-xs of-text-gray-500">
                            {post.commentCount} comments
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
