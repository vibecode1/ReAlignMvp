import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Copy, MoreVertical, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfidenceBar } from './ConfidenceBar';
import { ContextCard } from './ContextCard';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  context?: any;
  attachments?: Array<{ name: string; type: string }>;
  needsReview?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  emotionalState: string;
}

export function MessageBubble({ message, emotionalState }: MessageBubbleProps) {
  const isAI = message.type === 'ai';
  const isUser = message.type === 'user';
  
  // Adjust animation speed based on emotional state
  const animationDuration = emotionalState === 'stressed' ? 0.5 : 0.3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationDuration }}
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-[80%]',
        isUser && 'flex flex-col items-end'
      )}>
        <div className={cn(
          'rounded-lg px-4 py-3',
          isUser && 'bg-deep-ocean text-white',
          isAI && 'bg-lavender-mist/10 border border-lavender-mist/20',
          message.type === 'system' && 'bg-muted text-center w-full text-sm italic'
        )}>
          {/* AI Confidence Indicator */}
          {isAI && message.confidence && (
            <div className="mb-2">
              <ConfidenceBar confidence={message.confidence} size="small" />
            </div>
          )}
          
          {/* Message Text */}
          <p className={cn(
            'whitespace-pre-wrap',
            emotionalState === 'stressed' && 'text-lg leading-relaxed'
          )}>
            {message.content}
          </p>
          
          {/* Context Cards */}
          {message.context && (
            <div className="mt-3">
              <ContextCard context={message.context} />
            </div>
          )}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, idx) => (
                <div key={idx} className="text-xs flex items-center gap-1 text-muted-foreground">
                  <Paperclip size={12} />
                  {attachment.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Message Actions */}
        {isAI && (
          <div className="flex items-center gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <ThumbsUp size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <ThumbsDown size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Copy size={14} />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <MoreVertical size={14} />
            </Button>
          </div>
        )}
        
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}