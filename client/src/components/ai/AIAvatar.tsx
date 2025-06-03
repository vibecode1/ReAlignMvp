import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIAvatarProps {
  size?: 'small' | 'medium' | 'large';
  state?: 'waiting' | 'active' | 'thinking' | 'celebrating';
  className?: string;
}

export function AIAvatar({ size = 'medium', state = 'active', className }: AIAvatarProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const stateAnimations = {
    waiting: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } },
    active: { scale: 1 },
    thinking: { rotate: [0, 360], transition: { repeat: Infinity, duration: 3, ease: 'linear' } },
    celebrating: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-full bg-gradient-to-br from-lavender-mist to-cosmic-purple flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      animate={stateAnimations[state]}
    >
      <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur" />
      
      {/* AI Symbol */}
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-white relative z-10">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
      
      {/* State Indicators */}
      {state === 'thinking' && (
        <div className="absolute inset-0 rounded-full ai-thinking-gradient opacity-50" />
      )}
      
      {state === 'celebrating' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-sage-green rounded-full"
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 20,
                y: Math.sin(i * 60 * Math.PI / 180) * 20,
              }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </>
      )}
      
      {/* Active Indicator */}
      <div className={cn(
        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
        state === 'active' && 'bg-sage-green',
        state === 'thinking' && 'bg-warm-amber animate-pulse',
        state === 'waiting' && 'bg-gray-400'
      )} />
    </motion.div>
  );
}