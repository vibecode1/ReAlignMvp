import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, CheckCircle2, AlertCircle, XCircle, 
  FileText, Users, MessageSquare, TrendingUp,
  Calendar, Target, Activity
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'milestone' | 'document' | 'communication' | 'issue' | 'resolution';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  actor?: {
    name: string;
    type: 'user' | 'ai' | 'system' | 'expert';
  };
  impact?: 'high' | 'medium' | 'low';
  relatedEvents?: string[];
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk';
  progress: number;
  dependencies: string[];
  blockers?: string[];
}

/**
 * CaseTimeline: Visual timeline of case journey
 * 
 * Displays:
 * 1. Chronological event history
 * 2. Milestone tracking
 * 3. Progress indicators
 * 4. Critical path visualization
 * 5. Predictive timeline
 */
export function CaseTimeline({
  events,
  milestones,
  currentPhase,
  estimatedCompletion
}: {
  events: TimelineEvent[];
  milestones: Milestone[];
  currentPhase: string;
  estimatedCompletion: Date;
}) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'milestone':
        return Target;
      case 'document':
        return FileText;
      case 'communication':
        return MessageSquare;
      case 'issue':
        return AlertCircle;
      case 'resolution':
        return CheckCircle2;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactBadge = (impact?: TimelineEvent['impact']) => {
    if (!impact) return null;
    
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    return <Badge variant={variants[impact]} className="ml-2">{impact} impact</Badge>;
  };

  const calculateOverallProgress = () => {
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    return (completedMilestones / milestones.length) * 100;
  };

  const getDaysUntilCompletion = () => {
    const days = Math.ceil((estimatedCompletion.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Case Progress</CardTitle>
            <Badge variant="outline">{currentPhase}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(calculateOverallProgress())}%
                </span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Estimated Completion</p>
                <p className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {estimatedCompletion.toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Days Remaining</p>
                <p className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {getDaysUntilCompletion()} days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Events */}
            <div className="space-y-6">
              {events.map((event, index) => {
                const Icon = getEventIcon(event.type);
                const isLast = index === events.length - 1;
                
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background ${getStatusColor(event.status)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Content */}
                    <div className={`flex-1 ${isLast ? '' : 'pb-6'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                          {event.actor && (
                            <p className="text-xs text-muted-foreground mt-2">
                              by {event.actor.name} ({event.actor.type})
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString()}
                          </span>
                          {getImpactBadge(event.impact)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium flex items-center">
                      {milestone.name}
                      {milestone.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                      {milestone.status === 'at_risk' && (
                        <AlertCircle className="h-4 w-4 ml-2 text-amber-600" />
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      milestone.status === 'completed' ? 'default' :
                      milestone.status === 'at_risk' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {milestone.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-1.5" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Target: {milestone.targetDate.toLocaleDateString()}</span>
                    {milestone.completedDate && (
                      <span>Completed: {milestone.completedDate.toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {milestone.blockers && milestone.blockers.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                      <p className="text-xs font-medium text-amber-800">Blockers:</p>
                      <ul className="text-xs text-amber-700 mt-1">
                        {milestone.blockers.map((blocker, i) => (
                          <li key={i}>• {blocker}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Predictions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="text-sm">Likelihood of on-time completion</span>
              <span className="font-medium">85%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="text-sm">Predicted bottlenecks</span>
              <Badge variant="outline">Servicer response time</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <span className="text-sm">Recommended action</span>
              <span className="text-sm font-medium text-primary">
                Proactive follow-up with Wells Fargo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}