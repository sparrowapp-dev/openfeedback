import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    default: 'of-bg-gray-100 of-text-gray-700',
    primary: 'of-bg-primary/10 of-text-primary',
    success: 'of-bg-green-100 of-text-green-700',
    warning: 'of-bg-yellow-100 of-text-yellow-700',
    danger: 'of-bg-red-100 of-text-red-700',
    info: 'of-bg-blue-100 of-text-blue-700',
  };

  const sizes = {
    sm: 'of-px-2 of-py-0.5 of-text-xs',
    md: 'of-px-2.5 of-py-1 of-text-sm',
  };

  return (
    <span
      className={clsx(
        'of-inline-flex of-items-center of-font-medium of-rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
