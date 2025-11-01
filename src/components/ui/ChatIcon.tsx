/**
 * Chat Icon Component
 * 
 * Uses the startup splash robot icon for consistency across the app.
 * Idempotent: Safe to use multiple times without side effects.
 */

import React from 'react';
import { ROBOT_ICON_PATH } from '@/lib/brandIcons';
import { cn } from '@/lib/utils';

interface ChatIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Size variant for the icon
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Custom className
   */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
} as const;

/**
 * ChatIcon component that displays the brand robot icon
 * Used globally for chatbox, assistant UI, and AI-related features
 */
export const ChatIcon: React.FC<ChatIconProps> = ({
  size = 'md',
  className,
  alt = 'TradeLine 24/7 AI Assistant',
  ...props
}) => {
  return (
    <img
      src={ROBOT_ICON_PATH}
      alt={alt}
      className={cn(
        sizeClasses[size],
        'object-contain flex-shrink-0',
        className
      )}
      loading={props.loading || "lazy"}
      {...props}
    />
  );
};

/**
 * ChatIconButton - Pre-styled button with chat icon
 */
interface ChatIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ChatIconButton: React.FC<ChatIconButtonProps> = ({
  size = 'md',
  iconSize,
  className,
  children,
  ...props
}) => {
  const buttonSizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-5',
  };

  return (
    <button
      className={cn(
        'flex items-center justify-center',
        buttonSizeClasses[size],
        className
      )}
      {...props}
    >
      <ChatIcon size={iconSize || size} />
      {children}
    </button>
  );
};

