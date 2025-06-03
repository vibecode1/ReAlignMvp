import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBar({ 
  confidence, 
  size = 'medium', 
  showLabel = false,
  className 
}: ConfidenceBarProps) {
  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3',
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'bg-ai-high';
    if (confidence >= 0.6) return 'bg-ai-medium';
    return 'bg-ai-low';
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70">{getConfidenceLabel()}</span>
          <span className="font-medium">{Math.round(confidence * 100)}%</span>
        </div>
      )}
      <div className={cn('bg-white/20 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full transition-colors', getConfidenceColor())}
        />
      </div>
    </div>
  );
}