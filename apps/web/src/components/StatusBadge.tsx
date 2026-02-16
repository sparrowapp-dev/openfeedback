import React from 'react';
import type { PostStatus } from '@openfeedback/shared';

const STATUS_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'of-status-open' },
  'under review': { label: 'Under Review', className: 'of-status-under-review' },
  planned: { label: 'Planned', className: 'of-status-planned' },
  'in progress': { label: 'In Progress', className: 'of-status-in-progress' },
  complete: { label: 'Complete', className: 'of-status-complete' },
  closed: { label: 'Closed', className: 'of-status-closed' },
};

export interface StatusBadgeProps {
  status: PostStatus;
  className?: string;
}

/**
 * Status Badge Component
 * 
 * Displays post status with appropriate color coding.
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  
  return (
    <span className={`of-status-badge ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
