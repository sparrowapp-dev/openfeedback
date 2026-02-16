import React, { useEffect, useMemo, useState } from 'react';
import type { IPost, PostStatus, ICategory } from '@openfeedback/shared';
import { useFeedbackStore } from '../stores/feedbackStore';
import { PostCard } from './PostCard';
import * as api from '../services/api';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import toast from 'react-hot-toast';

export interface RoadmapProps {
  /** Board ID to display roadmap for */
  boardId: string;
  /** Statuses to show as columns */
  columns?: PostStatus[];
  /** Show category filter */
  showCategoryFilter?: boolean;
  /** Callback when a post is clicked */
  onPostClick?: (post: IPost) => void;
  /** Custom className */
  className?: string;
}

const DEFAULT_COLUMNS: PostStatus[] = ['planned', 'in progress', 'complete'];

const COLUMN_CONFIG: Record<PostStatus, { title: string; color: string }> = {
  open: { title: 'Open', color: 'of-bg-gray-100' },
  'under review': { title: 'Under Review', color: 'of-bg-amber-100' },
  planned: { title: 'Planned', color: 'of-bg-blue-100' },
  'in progress': { title: 'In Progress', color: 'of-bg-purple-100' },
  complete: { title: 'Complete', color: 'of-bg-green-100' },
  closed: { title: 'Closed', color: 'of-bg-gray-100' },
};

// Draggable Post Wrapper
function DraggablePost({
  post,
  onPostClick,
}: {
  post: IPost;
  onPostClick?: (post: IPost) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ 
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
        touchAction: 'none',
      }}
      onMouseDown={() => console.log('Mouse down on:', post.title)}
    >
      {/* Prevent PostCard's onClick from interfering */}
      <div onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'none' }}>
        <PostCard post={post} showStatus={false} />
      </div>
    </div>
  );
}

// Droppable Column Wrapper
function DroppableColumn({
  status,
  children,
}: {
  status: PostStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`of-flex-1 of-space-y-3 of-overflow-y-auto of-min-h-[200px] of-p-2 of-rounded-lg of-transition-colors ${
        isOver ? 'of-bg-blue-50 of-ring-2 of-ring-blue-300' : ''
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Roadmap Component
 * 
 * Kanban-style roadmap showing posts grouped by status.
 * 
 * @example
 * ```tsx
 * <OpenFeedbackProvider apiUrl="..." apiKey="...">
 *   <Roadmap 
 *     boardId="abc123"
 *     columns={['planned', 'in progress', 'complete']}
 *     onPostClick={(post) => openDetail(post)}
 *   />
 * </OpenFeedbackProvider>
 * ```
 */
export function Roadmap({
  boardId,
  columns,
  showCategoryFilter = true,
  onPostClick,
  className = '',
}: RoadmapProps) {
  const {
    posts,
    isLoadingPosts,
    fetchPosts,
    fetchCategories,
    setCurrentBoard,
    boards,
    categories,
  } = useFeedbackStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activePost, setActivePost] = useState<IPost | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Require only 3px movement before drag starts
      },
    })
  );

  console.log('Roadmap rendered with', posts.length, 'posts');

  const currentBoard = boards.find(b => b.id === boardId);
  
  // Use board-specific statuses or provided columns or default
  const displayColumns = columns || (currentBoard?.statuses as PostStatus[]) || DEFAULT_COLUMNS;

  // Initialize board and categories
  useEffect(() => {
    if (currentBoard) {
      setCurrentBoard(currentBoard);
    } else {
      fetchPosts(boardId, true);
    }
    fetchCategories(boardId);
  }, [boardId, boards]);

  // Group posts by status
  const groupedPosts = useMemo(() => {
    const groups: Record<PostStatus, IPost[]> = {
      open: [],
      'under review': [],
      planned: [],
      'in progress': [],
      complete: [],
      closed: [],
    };

    posts.forEach((post) => {
      if (displayColumns.includes(post.status)) {
        // Apply category filter if selected
        if (!selectedCategory || post.category?.id === selectedCategory) {
          groups[post.status].push(post);
        }
      }
    });

    return groups;
  }, [posts, displayColumns, selectedCategory]);

  const handleDragStart = (event: DragStartEvent) => {
    const post = event.active.data.current?.post as IPost | undefined;
    if (post) {
      console.log('Drag started:', post.title);
      setActivePost(post);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag ended - Active:', active.id, 'Over:', over?.id);
    setActivePost(null);

    if (!over) return;

    const post = active.data.current?.post as IPost;
    const newStatus = over.id as PostStatus;

    // Don't update if status hasn't changed
    if (post.status === newStatus) {
      console.log('Status unchanged:', newStatus);
      return;
    }

    console.log('Updating post status from', post.status, 'to', newStatus);

    try {
      // Update the post status on the backend
      await api.changePostStatus(post.id, newStatus);
      
      // Refresh posts to get the updated data
      await fetchPosts(boardId, true);
      
      toast.success(`Post moved to ${COLUMN_CONFIG[newStatus].title}`);
    } catch (error) {
      console.error('Failed to update post status:', error);
      toast.error('Failed to update post status');
      // Refresh to revert optimistic update
      await fetchPosts(boardId, true);
    }
  };

  if (isLoadingPosts && posts.length === 0) {
    return (
      <div className={`of-roadmap of-flex of-gap-4 of-p-4 of-overflow-x-auto ${className}`}>
        {displayColumns.map((status) => (
          <div key={status} className="of-flex-shrink-0 of-w-80">
            <div className="of-animate-pulse">
              <div className="of-h-8 of-bg-gray-200 of-rounded of-mb-4" />
              <div className="of-space-y-3">
                <div className="of-h-24 of-bg-gray-100 of-rounded" />
                <div className="of-h-24 of-bg-gray-100 of-rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`of-roadmap of-flex of-flex-col of-h-full ${className}`}>
        {/* Category Filter */}
        {showCategoryFilter && categories.length > 0 && (
          <div className="of-px-4 of-py-3 of-border-b of-border-gray-200 of-bg-white">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="of-px-3 of-py-2 of-text-sm of-border of-border-gray-200 of-rounded-lg of-bg-white focus:of-outline-none focus:of-ring-2 focus:of-ring-primary/20 focus:of-border-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Columns */}
        <div className="of-flex of-gap-4 of-p-4 of-overflow-x-auto of-flex-1">
          {displayColumns.map((status) => {
          const config = COLUMN_CONFIG[status];
          const columnPosts = groupedPosts[status];

          return (
            <div 
              key={status} 
              className="of-flex-shrink-0 of-w-80 of-flex of-flex-col"
            >
              {/* Column Header */}
              <div className={`of-px-3 of-py-2 of-rounded-lg of-mb-3 ${config.color}`}>
                <div className="of-flex of-items-center of-justify-between">
                  <h3 className="of-font-semibold of-text-gray-800">{config.title}</h3>
                  <span className="of-text-sm of-text-gray-600 of-font-medium">
                    {columnPosts.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <DroppableColumn status={status}>
                {columnPosts.length === 0 ? (
                  <div className="of-text-center of-py-8 of-text-gray-400 of-text-sm">
                    Drop items here
                  </div>
                ) : (
                  columnPosts.map((post) => (
                    <DraggablePost
                      key={post.id}
                      post={post}
                      onPostClick={onPostClick}
                    />
                  ))
                )}
              </DroppableColumn>
            </div>
          );
        })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activePost ? (
          <div className="of-w-80 of-opacity-90">
            <PostCard post={activePost} showStatus={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default Roadmap;
