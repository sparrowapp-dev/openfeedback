import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(str: string): string {
  const colors = [
    'of-bg-red-500',
    'of-bg-orange-500',
    'of-bg-amber-500',
    'of-bg-yellow-500',
    'of-bg-lime-500',
    'of-bg-green-500',
    'of-bg-emerald-500',
    'of-bg-teal-500',
    'of-bg-cyan-500',
    'of-bg-sky-500',
    'of-bg-blue-500',
    'of-bg-indigo-500',
    'of-bg-violet-500',
    'of-bg-purple-500',
    'of-bg-fuchsia-500',
    'of-bg-pink-500',
    'of-bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, name = 'User', size = 'md', className }: AvatarProps) {
  const sizes = {
    xs: 'of-w-6 of-h-6 of-text-xs',
    sm: 'of-w-8 of-h-8 of-text-sm',
    md: 'of-w-10 of-h-10 of-text-base',
    lg: 'of-w-12 of-h-12 of-text-lg',
    xl: 'of-w-16 of-h-16 of-text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(
          'of-rounded-full of-object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        'of-rounded-full of-flex of-items-center of-justify-center of-text-white of-font-medium',
        sizes[size],
        stringToColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
