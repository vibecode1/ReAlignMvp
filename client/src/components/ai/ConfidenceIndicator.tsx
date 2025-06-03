import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-1
  showLabel?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  context?: string;
}

const confidenceLevels = {
  high: {
    label: 'High Confidence',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'AI is very confident in this response'
  },
  medium: {
    label: 'Medium Confidence',
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'AI has moderate confidence in this response'
  },
  low: {
    label: 'Low Confidence',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'AI has some uncertainty about this response'
  },
  veryLow: {
    label: 'Very Low Confidence',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'AI is uncertain - human review recommended'
  }
};

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    progress: 'h-1'
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    progress: 'h-2'
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    progress: 'h-3'
  }
};

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  if (confidence >= 0.5) return 'low';
  return 'veryLow';
}

function getProgressColor(confidence: number) {
  if (confidence >= 0.9) return 'bg-green-600';
  if (confidence >= 0.7) return 'bg-blue-600';
  if (confidence >= 0.5) return 'bg-amber-600';
  return 'bg-red-600';
}

export function ConfidenceIndicator({
  confidence,
  showLabel = false,
  showTooltip = true,
  size = 'md',
  className,
  context
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const config = confidenceLevels[level];
  const Icon = config.icon;
  const sizes = sizeConfig[size];
  const percentage = Math.round(confidence * 100);

  const indicator = (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <Icon className={cn(sizes.icon, config.color)} />
      </div>
      
      {showLabel && (
        <div className="flex flex-col gap-1">
          <span className={cn(sizes.text, "font-medium")}>
            {percentage}% Confident
          </span>
          {size !== 'sm' && (
            <Progress 
              value={percentage} 
              className={cn(sizes.progress, "w-20")}
              indicatorClassName={getProgressColor(confidence)}
            />
          )}
        </div>
      )}
    </div>
  );

  if (!showTooltip) return indicator;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{config.label}</div>
            <div className="text-sm text-muted-foreground">
              {config.description}
            </div>
            {context && (
              <div className="text-sm border-t pt-2">
                <span className="font-medium">Context:</span> {context}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Progress 
                value={percentage} 
                className="h-2 flex-1"
                indicatorClassName={getProgressColor(confidence)}
              />
              <span className="font-mono">{percentage}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}