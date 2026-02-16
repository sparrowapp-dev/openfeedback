import React, { useState, useCallback, useEffect } from 'react';
import { useOpenFeedback } from '../hooks/useOpenFeedback';
import { useFeedbackStore } from '../stores/feedbackStore';

export interface VoteButtonProps {
  /** Post ID to vote on */
  postId: string;
  /** Current vote count */
  score: number;
  /** Whether current user has voted */
  hasVoted?: boolean;
  /** Optional callback after vote action */
  onVoteChange?: (voted: boolean) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

/**
 * VoteButton Component
 * 
 * Upvote button with score display. Handles vote/unvote toggle.
 * 
 * @example
 * ```tsx
 * <VoteButton postId="abc123" score={42} hasVoted={false} />
 * ```
 */
export function VoteButton({
  postId,
  score,
  hasVoted = false,
  onVoteChange,
  size = 'md',
  className = '',
}: VoteButtonProps) {
  const { userId, ensureUser, isUserLoading } = useOpenFeedback();
  const { votePost, unvotePost } = useFeedbackStore();
  const [isVoting, setIsVoting] = useState(false);
  const [localHasVoted, setLocalHasVoted] = useState(hasVoted);
  const [localScore, setLocalScore] = useState(score);

  // Sync with prop when it changes
  useEffect(() => {
    setLocalHasVoted(hasVoted);
  }, [hasVoted]);

  // Sync score with prop when it changes
  useEffect(() => {
    setLocalScore(score);
  }, [score]);

  const handleVote = useCallback(async () => {
    if (isVoting || isUserLoading) return;

    setIsVoting(true);
    try {
      const currentUserId = await ensureUser();
      if (!currentUserId) {
        console.error('Could not get user ID');
        return;
      }

      if (localHasVoted) {
        await unvotePost(postId, currentUserId);
        setLocalHasVoted(false);
        setLocalScore((s) => Math.max(0, s - 1));
        onVoteChange?.(false);
      } else {
        await votePost(postId, currentUserId);
        setLocalHasVoted(true);
        setLocalScore((s) => s + 1);
        onVoteChange?.(true);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  }, [postId, localHasVoted, isVoting, isUserLoading, ensureUser, votePost, unvotePost, onVoteChange]);

  // Size classes
  const sizeClasses = {
    sm: 'of-px-2 of-py-1 of-text-xs',
    md: 'of-px-3 of-py-2 of-text-sm',
    lg: 'of-px-4 of-py-3 of-text-base',
  };

  const iconSizes = {
    sm: 'of-w-3 of-h-3',
    md: 'of-w-4 of-h-4',
    lg: 'of-w-5 of-h-5',
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isVoting || isUserLoading}
      className={`
        of-inline-flex of-flex-col of-items-center of-justify-center
        of-rounded-lg of-border of-font-medium of-transition-all
        ${localHasVoted 
          ? 'of-bg-primary of-text-white of-border-primary' 
          : 'of-bg-white of-text-gray-700 of-border-gray-200 hover:of-border-primary hover:of-text-primary'
        }
        ${isVoting ? 'of-opacity-50 of-cursor-not-allowed' : 'of-cursor-pointer'}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      aria-label={localHasVoted ? 'Remove vote' : 'Upvote'}
    >
      {/* Upvote Arrow */}
      <svg 
        className={`${iconSizes[size]} ${localHasVoted ? 'of-fill-current' : 'of-stroke-current of-fill-none'}`}
        viewBox="0 0 24 24" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M5 15l7-7 7 7"
        />
      </svg>
      {/* Vote Count */}
      <span className="of-mt-0.5 of-font-semibold">{localScore}</span>
    </button>
  );
}

export default VoteButton;
