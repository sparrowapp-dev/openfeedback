import { forwardRef, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className={clsx('of-flex of-flex-col of-gap-1.5', fullWidth && 'of-w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="of-text-sm of-font-medium of-text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'of-w-full of-px-3 of-py-2 of-border of-rounded-lg of-text-gray-900 of-placeholder-gray-400',
            'focus:of-outline-none focus:of-ring-2 focus:of-ring-primary focus:of-border-transparent',
            'of-transition-colors of-duration-200 of-resize-none',
            error
              ? 'of-border-red-500 focus:of-ring-red-500'
              : 'of-border-gray-300',
            props.disabled && 'of-bg-gray-50 of-cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="of-text-sm of-text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="of-text-sm of-text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
