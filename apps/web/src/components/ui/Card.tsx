import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  padding = 'md',
  hoverable = false,
  onClick,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'of-p-3',
    md: 'of-p-4',
    lg: 'of-p-6',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'of-bg-white of-rounded-lg of-border of-border-gray-200 of-shadow-sm',
        paddings[padding],
        hoverable && 'hover:of-shadow-md of-transition-shadow of-cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('of-border-b of-border-gray-200 of-pb-4 of-mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={clsx('of-text-lg of-font-semibold of-text-gray-900', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('of-text-sm of-text-gray-500 of-mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('of-border-t of-border-gray-200 of-pt-4 of-mt-4', className)}>
      {children}
    </div>
  );
}
