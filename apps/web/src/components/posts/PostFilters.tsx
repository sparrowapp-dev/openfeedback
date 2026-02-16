import { Input, Select } from '../ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { PostStatus } from '@openfeedback/shared';

export interface PostFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  status: PostStatus | 'all';
  onStatusChange: (status: PostStatus | 'all') => void;
  sort: 'newest' | 'oldest' | 'score' | 'trending';
  onSortChange: (sort: 'newest' | 'oldest' | 'score' | 'trending') => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'score', label: 'Most Votes' },
  { value: 'trending', label: 'Trending' },
];

/**
 * PostFilters Component
 * 
 * Filter and sort controls for post lists.
 */
export function PostFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: PostFiltersProps) {
  return (
    <div className="of-flex of-flex-col sm:of-flex-row of-gap-3">
      <div className="of-flex-1">
        <Input
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="of-w-5 of-h-5" />}
        />
      </div>
      
      <div className="of-flex of-gap-3">
        <div className="of-w-40">
          <Select
            value={status}
            onChange={(value) => onStatusChange(value as PostStatus | 'all')}
            options={STATUS_OPTIONS}
            fullWidth
          />
        </div>
        
        <div className="of-w-36">
          <Select
            value={sort}
            onChange={(value) => onSortChange(value as 'newest' | 'oldest' | 'score' | 'trending')}
            options={SORT_OPTIONS}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}
