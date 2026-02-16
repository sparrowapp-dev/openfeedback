import { useState, useEffect } from 'react';
import type { IBoard } from '@openfeedback/shared';
import { BoardCard } from './BoardCard';
import { Spinner, Button } from '../ui';
import { PlusIcon } from '@heroicons/react/24/outline';

export interface BoardListProps {
  boards: IBoard[];
  isLoading?: boolean;
  onCreateBoard?: () => void;
  emptyMessage?: string;
}

/**
 * BoardList Component
 * 
 * Displays a grid of BoardCards with loading and empty states.
 */
export function BoardList({
  boards,
  isLoading = false,
  onCreateBoard,
  emptyMessage = 'No boards yet',
}: BoardListProps) {
  if (isLoading) {
    return (
      <div className="of-flex of-items-center of-justify-center of-py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="of-text-center of-py-12 of-bg-white of-rounded-lg of-border of-border-gray-200 of-shadow-sm of-max-w-md of-mx-auto">
        <div className="of-w-16 of-h-16 of-bg-gray-100 of-rounded-full of-flex of-items-center of-justify-center of-mx-auto of-mb-4">
          <PlusIcon className="of-w-8 of-h-8 of-text-gray-400" />
        </div>
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          {emptyMessage}
        </h3>
        <p className="of-text-gray-500 of-mb-4">
          Create your first board to start collecting feedback
        </p>
        {onCreateBoard && (
          <div className="of-flex of-justify-center">
            <Button onClick={onCreateBoard}>
              <PlusIcon className="of-w-4 of-h-4 of-mr-2" />
              Create Board
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="of-grid of-grid-cols-1 sm:of-grid-cols-2 lg:of-grid-cols-3 of-gap-4">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
}
