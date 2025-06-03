import React from 'react';
import { Heart, Brain, Sun, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotionalIndicatorProps {
  state: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export function EmotionalIndicator({ 
  state, 
  size = 'medium', 
  showLabel = false,
  className 
}: EmotionalIndicatorProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const emotionalStates = {
    stressed: { icon: Cloud, color: 'text-calm-sky', label: 'Feeling stressed' },
    confused: { icon: Brain, color: 'text-warm-amber', label: 'Feeling confused' },
    hopeful: { icon: Sun, color: 'text-sage-green', label: 'Feeling hopeful' },
    confident: { icon: Heart, color: 'text-lavender-mist', label: 'Feeling confident' },
  };

  const currentState = emotionalStates[state] || emotionalStates.confident;
  const Icon = currentState.icon;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon className={cn(sizeClasses[size], currentState.color)} />
      {showLabel && (
        <span className={cn('text-xs', currentState.color)}>
          {currentState.label}
        </span>
      )}
    </div>
  );
}