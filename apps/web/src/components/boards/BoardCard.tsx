import { Link } from 'react-router-dom';
import type { IBoard } from '@openfeedback/shared';
import { Card } from '../ui';
import {
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

export interface BoardCardProps {
  board: IBoard;
  postCount?: number;
}

/**
 * BoardCard Component
 * 
 * Displays a board preview card with name, post count, and privacy status.
 */
export function BoardCard({ board, postCount = 0 }: BoardCardProps) {
  return (
    <Link to={`/board/${board.id}`} className="of-block">
      <Card className="hover:of-shadow-md of-transition-shadow of-cursor-pointer">
        <div className="of-p-4">
          <div className="of-flex of-items-start of-justify-between of-mb-3">
            <div className="of-w-12 of-h-12 of-bg-primary/10 of-rounded-lg of-flex of-items-center of-justify-center">
              <ChatBubbleLeftRightIcon className="of-w-6 of-h-6 of-text-primary" />
            </div>
            {board.isPrivate ? (
              <span className="of-inline-flex of-items-center of-gap-1 of-text-xs of-text-gray-500 of-bg-gray-100 of-px-2 of-py-1 of-rounded-full">
                <LockClosedIcon className="of-w-3 of-h-3" />
                Private
              </span>
            ) : (
              <span className="of-inline-flex of-items-center of-gap-1 of-text-xs of-text-green-600 of-bg-green-50 of-px-2 of-py-1 of-rounded-full">
                <GlobeAltIcon className="of-w-3 of-h-3" />
                Public
              </span>
            )}
          </div>
          
          <h3 className="of-text-lg of-font-semibold of-text-gray-900 of-mb-1">
            {board.name}
          </h3>
          
          <p className="of-text-sm of-text-gray-500">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </p>
          
          <div className="of-mt-3 of-pt-3 of-border-t of-border-gray-100 of-flex of-items-center of-justify-between of-text-xs of-text-gray-400">
            <span>
              Created {new Date(board.created).toLocaleDateString()}
            </span>
            <span className="of-text-primary of-font-medium">
              View board →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
