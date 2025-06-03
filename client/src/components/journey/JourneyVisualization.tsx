import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, Clock, FileText, Brain, Send, MessageSquare, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const milestones = [
  { id: 'intake', label: 'Initial Contact', icon: Circle },
  { id: 'documents', label: 'Document Collection', icon: FileText },
  { id: 'analysis', label: 'Financial Analysis', icon: Brain },
  { id: 'submission', label: 'Application Submitted', icon: Send },
  { id: 'negotiation', label: 'Negotiation', icon: MessageSquare },
  { id: 'resolution', label: 'Resolution', icon: CheckCircle },
];

interface JourneyVisualizationProps {
  className?: string;
}

export function JourneyVisualization({ className }: JourneyVisualizationProps) {
  // Mock data - would be fetched from context/API
  const currentCase = {
    id: '123456',
    status: 'analysis',
    createdAt: new Date('2025-01-15'),
    aiPrediction: "Based on your documentation completeness and financial profile, we expect a positive resolution within 15-20 days."
  };
  
  const currentMilestoneIndex = milestones.findIndex(m => m.id === currentCase.status);
  const overallProgress = ((currentMilestoneIndex + 1) / milestones.length) * 100;

  return (
    <div className={cn('bg-background border-b', className)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Your Loss Mitigation Journey</h3>
            <p className="text-sm text-muted-foreground">
              Started {currentCase.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-sage-green">{Math.round(overallProgress)}%</div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <Progress value={overallProgress} className="h-2 mb-4" />
        
        {/* Milestones */}
        <div className="flex items-center justify-between">
          {milestones.map((milestone, index) => {
            const isCompleted = index < currentMilestoneIndex;
            const isCurrent = index === currentMilestoneIndex;
            const Icon = milestone.icon;
            
            return (
              <div key={milestone.id} className="flex flex-col items-center flex-1 relative">
                {/* Connector Line */}
                {index > 0 && (
                  <div className={cn(
                    'absolute h-0.5 -mt-4 left-0 right-1/2 -translate-x-full',
                    isCompleted ? 'bg-sage-green' : 'bg-muted'
                  )} />
                )}
                
                {/* Milestone Icon */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    y: isCurrent ? -2 : 0,
                  }}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center relative',
                    isCompleted && 'bg-sage-green text-white',
                    isCurrent && 'bg-calm-sky text-white shadow-lg',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Icon size={16} />
                  )}
                  
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-calm-sky animate-ping opacity-25" />
                  )}
                </motion.div>
                
                {/* Milestone Label */}
                <span className={cn(
                  'text-xs mt-1 text-center',
                  isCurrent && 'font-semibold'
                )}>
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* AI Prediction */}
        {currentCase.aiPrediction && (
          <div className="mt-4 p-3 bg-lavender-mist/10 rounded-lg flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-lavender-mist mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{currentCase.aiPrediction}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on analysis of 1,247 similar cases
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}