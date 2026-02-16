import { clsx } from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'of-w-4 of-h-4',
    md: 'of-w-6 of-h-6',
    lg: 'of-w-8 of-h-8',
  };

  return (
    <svg
      className={clsx('of-animate-spin of-text-primary', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="of-opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="of-opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="of-flex of-flex-col of-items-center of-justify-center of-min-h-[400px] of-gap-4">
      <Spinner size="lg" />
      <p className="of-text-gray-500">{message}</p>
    </div>
  );
}
