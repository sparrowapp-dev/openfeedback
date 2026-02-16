import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className={clsx('of-flex of-flex-col of-gap-1.5', fullWidth && 'of-w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="of-text-sm of-font-medium of-text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="of-relative">
          {leftIcon && (
            <div className="of-absolute of-left-3 of-top-1/2 of--translate-y-1/2 of-text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'of-w-full of-px-3 of-py-2 of-border of-rounded-lg of-text-gray-900 of-placeholder-gray-400',
              'focus:of-outline-none focus:of-ring-2 focus:of-ring-primary focus:of-border-transparent',
              'of-transition-colors of-duration-200',
              error
                ? 'of-border-red-500 focus:of-ring-red-500'
                : 'of-border-gray-300',
              leftIcon && 'of-pl-10',
              rightIcon && 'of-pr-10',
              props.disabled && 'of-bg-gray-50 of-cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="of-absolute of-right-3 of-top-1/2 of--translate-y-1/2 of-text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="of-text-sm of-text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="of-text-sm of-text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
