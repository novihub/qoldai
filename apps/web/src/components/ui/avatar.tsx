'use client';

import { forwardRef, ImgHTMLAttributes, useState } from 'react';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];
  
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name = '?', size = 'md', className = '', alt, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex items-center justify-center rounded-full overflow-hidden
          ${sizeStyles[size]}
          ${showFallback ? getColorFromName(name) : 'bg-gray-200'}
          ${className}
        `}
      >
        {showFallback ? (
          <span className="font-medium text-white">{getInitials(name)}</span>
        ) : (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            {...props}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
