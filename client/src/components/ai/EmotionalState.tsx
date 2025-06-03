import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Frown, Smile, Meh, AlertTriangle, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Emotion {
  type: 'happy' | 'sad' | 'anxious' | 'frustrated' | 'hopeful' | 'neutral';
  intensity: number; // 0-1
  confidence: number; // 0-1
}

export interface EmotionalStateData {
  primary: Emotion;
  secondary?: Emotion;
  distressLevel: number; // 0-1
  trajectory: 'improving' | 'stable' | 'declining';
  shouldEscalate: boolean;
}

interface EmotionalStateProps {
  state: EmotionalStateData;
  showDetails?: boolean;
  onEscalate?: () => void;
  className?: string;
}

const emotionConfig = {
  happy: {
    label: 'Happy',
    icon: Smile,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  sad: {
    label: 'Sad',
    icon: Frown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  anxious: {
    label: 'Anxious',
    icon: AlertTriangle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  frustrated: {
    label: 'Frustrated',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  hopeful: {
    label: 'Hopeful',
    icon: Sparkles,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  neutral: {
    label: 'Neutral',
    icon: Meh,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
};

const trajectoryConfig = {
  improving: {
    label: 'Improving',
    color: 'text-green-600',
    icon: '↗'
  },
  stable: {
    label: 'Stable',
    color: 'text-blue-600',
    icon: '→'
  },
  declining: {
    label: 'Declining',
    color: 'text-red-600',
    icon: '↘'
  }
};

function EmotionDisplay({ emotion, size = 'md' }: { emotion: Emotion; size?: 'sm' | 'md' }) {
  const config = emotionConfig[emotion.type];
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "rounded-full p-1.5",
                config.bgColor,
                config.borderColor,
                "border"
              )}
              style={{ opacity: 0.7 + emotion.intensity * 0.3 }}
            >
              <Icon className={cn(iconSize, config.color)} />
            </div>
            <span className={cn(textSize, "font-medium")}>{config.label}</span>
            <Progress 
              value={emotion.intensity * 100} 
              className="h-1.5 w-16"
              indicatorClassName={config.color.replace('text-', 'bg-')}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <div>Intensity: {Math.round(emotion.intensity * 100)}%</div>
            <div>Confidence: {Math.round(emotion.confidence * 100)}%</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EmotionalState({
  state,
  showDetails = true,
  onEscalate,
  className
}: EmotionalStateProps) {
  const trajectory = trajectoryConfig[state.trajectory];
  const distressPercentage = Math.round(state.distressLevel * 100);

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Emotional State
          </h3>
          {state.shouldEscalate && onEscalate && (
            <Badge 
              variant="destructive" 
              className="cursor-pointer animate-pulse"
              onClick={onEscalate}
            >
              Needs Attention
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {/* Primary emotion */}
          <div>
            <div className="text-xs text-muted-foreground mb-1">Primary</div>
            <EmotionDisplay emotion={state.primary} />
          </div>

          {/* Secondary emotion */}
          {state.secondary && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Secondary</div>
              <EmotionDisplay emotion={state.secondary} size="sm" />
            </div>
          )}

          {showDetails && (
            <>
              {/* Distress level */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Distress Level</span>
                  <span className={cn(
                    "font-medium",
                    distressPercentage > 70 ? "text-red-600" :
                    distressPercentage > 40 ? "text-amber-600" :
                    "text-green-600"
                  )}>
                    {distressPercentage}%
                  </span>
                </div>
                <Progress 
                  value={distressPercentage} 
                  className="h-2"
                  indicatorClassName={cn(
                    distressPercentage > 70 ? "bg-red-600" :
                    distressPercentage > 40 ? "bg-amber-600" :
                    "bg-green-600"
                  )}
                />
              </div>

              {/* Trajectory */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Trajectory</span>
                <div className={cn("flex items-center gap-1", trajectory.color)}>
                  <span className="text-lg leading-none">{trajectory.icon}</span>
                  <span className="text-sm font-medium">{trajectory.label}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}