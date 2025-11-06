/**
 * ProgressBarMini Component
 * 
 * A lightweight 4px progress bar for onboarding flows.
 * Uses existing design tokens and utilities.
 */

import React from 'react';

interface ProgressBarMiniProps {
  progress: number; // 0-100
  className?: string;
}

export const ProgressBarMini: React.FC<ProgressBarMiniProps> = ({ 
  progress, 
  className = '' 
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div 
      className={`w-full h-1 bg-muted rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${clampedProgress}%`}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};

