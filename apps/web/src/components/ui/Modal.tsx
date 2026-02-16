import { Fragment, ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const sizes = {
    sm: 'of-max-w-sm',
    md: 'of-max-w-md',
    lg: 'of-max-w-lg',
    xl: 'of-max-w-xl',
    full: 'of-max-w-4xl',
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="of-relative of-z-50">
        <TransitionChild
          as={Fragment}
          enter="of-ease-out of-duration-300"
          enterFrom="of-opacity-0"
          enterTo="of-opacity-100"
          leave="of-ease-in of-duration-200"
          leaveFrom="of-opacity-100"
          leaveTo="of-opacity-0"
        >
          <div className="of-fixed of-inset-0 of-bg-black/50" />
        </TransitionChild>

        <div className="of-fixed of-inset-0 of-overflow-y-auto">
          <div className="of-flex of-min-h-full of-items-center of-justify-center of-p-4">
            <TransitionChild
              as={Fragment}
              enter="of-ease-out of-duration-300"
              enterFrom="of-opacity-0 of-scale-95"
              enterTo="of-opacity-100 of-scale-100"
              leave="of-ease-in of-duration-200"
              leaveFrom="of-opacity-100 of-scale-100"
              leaveTo="of-opacity-0 of-scale-95"
            >
              <DialogPanel
                className={clsx(
                  'of-w-full of-transform of-overflow-hidden of-rounded-xl of-bg-white of-shadow-xl of-transition-all',
                  sizes[size]
                )}
              >
                {(title || showCloseButton) && (
                  <div className="of-flex of-items-center of-justify-between of-px-6 of-py-4 of-border-b of-border-gray-200">
                    {title && (
                      <DialogTitle className="of-text-lg of-font-semibold of-text-gray-900">
                        {title}
                      </DialogTitle>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="of-text-gray-400 hover:of-text-gray-600 of-transition-colors"
                      >
                        <XMarkIcon className="of-w-5 of-h-5" />
                      </button>
                    )}
                  </div>
                )}
                <div className="of-p-6">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
