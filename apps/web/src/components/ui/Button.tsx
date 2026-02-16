import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'of-inline-flex of-items-center of-justify-center of-font-medium of-rounded-lg of-transition-all of-duration-200 focus:of-outline-none focus:of-ring-2 focus:of-ring-offset-2 disabled:of-opacity-50 disabled:of-cursor-not-allowed';

    const variants = {
      primary: 'of-bg-primary of-text-white hover:of-bg-primary-dark focus:of-ring-primary',
      secondary: 'of-bg-gray-100 of-text-gray-700 hover:of-bg-gray-200 focus:of-ring-gray-300',
      outline: 'of-border of-border-gray-300 of-bg-transparent of-text-gray-700 hover:of-bg-gray-50 focus:of-ring-gray-300',
      ghost: 'of-bg-transparent of-text-gray-600 hover:of-bg-gray-100 focus:of-ring-gray-300',
      danger: 'of-bg-red-600 of-text-white hover:of-bg-red-700 focus:of-ring-red-500',
    };

    const sizes = {
      sm: 'of-px-3 of-py-1.5 of-text-sm of-gap-1.5',
      md: 'of-px-4 of-py-2 of-text-sm of-gap-2',
      lg: 'of-px-6 of-py-3 of-text-base of-gap-2',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'of-w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="of-animate-spin of-h-4 of-w-4" fill="none" viewBox="0 0 24 24">
            <circle className="of-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="of-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon ? (
          <span className="of-flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="of-flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
