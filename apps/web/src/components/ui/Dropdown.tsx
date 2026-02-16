import { Fragment, ReactNode } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  return (
    <Menu as="div" className="of-relative of-inline-block of-text-left">
      <MenuButton as={Fragment}>{trigger}</MenuButton>
      <Transition
        as={Fragment}
        enter="of-transition of-ease-out of-duration-100"
        enterFrom="of-transform of-opacity-0 of-scale-95"
        enterTo="of-transform of-opacity-100 of-scale-100"
        leave="of-transition of-ease-in of-duration-75"
        leaveFrom="of-transform of-opacity-100 of-scale-100"
        leaveTo="of-transform of-opacity-0 of-scale-95"
      >
        <MenuItems
          className={clsx(
            'of-absolute of-z-10 of-mt-2 of-w-48 of-origin-top-right of-rounded-lg of-bg-white of-shadow-lg of-ring-1 of-ring-black/5 focus:of-outline-none of-py-1',
            align === 'right' ? 'of-right-0' : 'of-left-0'
          )}
        >
          {items.map((item, index) => (
            <MenuItem key={index}>
              {({ focus }) => (
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={clsx(
                    'of-flex of-items-center of-gap-2 of-w-full of-px-4 of-py-2 of-text-sm of-text-left',
                    focus && 'of-bg-gray-100',
                    item.danger ? 'of-text-red-600' : 'of-text-gray-700',
                    item.disabled && 'of-opacity-50 of-cursor-not-allowed'
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}

// Simple select dropdown
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  fullWidth?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  fullWidth = true,
}: SelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={clsx('of-flex of-flex-col of-gap-1.5', fullWidth && 'of-w-full')}>
      {label && (
        <label className="of-text-sm of-font-medium of-text-gray-700">{label}</label>
      )}
      <Menu as="div" className="of-relative">
        <MenuButton className="of-w-full of-flex of-items-center of-justify-between of-px-3 of-py-2 of-border of-border-gray-300 of-rounded-lg of-bg-white of-text-left focus:of-outline-none focus:of-ring-2 focus:of-ring-primary">
          <span className={selected ? 'of-text-gray-900' : 'of-text-gray-400'}>
            {selected?.label || placeholder}
          </span>
          <ChevronDownIcon className="of-w-5 of-h-5 of-text-gray-400" />
        </MenuButton>
        <Transition
          as={Fragment}
          enter="of-transition of-ease-out of-duration-100"
          enterFrom="of-transform of-opacity-0 of-scale-95"
          enterTo="of-transform of-opacity-100 of-scale-100"
          leave="of-transition of-ease-in of-duration-75"
          leaveFrom="of-transform of-opacity-100 of-scale-100"
          leaveTo="of-transform of-opacity-0 of-scale-95"
        >
          <MenuItems className="of-absolute of-z-10 of-mt-1 of-w-full of-rounded-lg of-bg-white of-shadow-lg of-ring-1 of-ring-black/5 focus:of-outline-none of-py-1 of-max-h-60 of-overflow-auto">
            {options.map((option) => (
              <MenuItem key={option.value}>
                {({ focus }) => (
                  <button
                    onClick={() => onChange(option.value)}
                    className={clsx(
                      'of-w-full of-px-4 of-py-2 of-text-sm of-text-left',
                      focus && 'of-bg-gray-100',
                      value === option.value
                        ? 'of-text-primary of-font-medium'
                        : 'of-text-gray-700'
                    )}
                  >
                    {option.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
}
