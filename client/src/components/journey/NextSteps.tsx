import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, Clock, User, Bot, CheckCircle,
  AlertTriangle, Calendar, FileText, Phone
} from 'lucide-react';

interface NextStep {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'document' | 'communication' | 'review' | 'wait';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: {
    type: 'user' | 'ai' | 'system';
    name: string;
  };
  estimatedTime?: string;
  deadline?: Date;
  prerequisites?: string[];
  impact: string;
  aiRecommended?: boolean;
  confidence?: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

/**
 * NextSteps: Smart recommendations for next actions
 * 
 * Features:
 * 1. Prioritized action items
 * 2. AI-powered recommendations
 * 3. Time estimates
 * 4. Impact analysis
 * 5. Quick action buttons
 */
export function NextSteps({
  steps,
  quickActions,
  onStartStep,
  onDismissStep
}: {
  steps: NextStep[];
  quickActions?: QuickAction[];
  onStartStep?: (stepId: string) => void;
  onDismissStep?: (stepId: string) => void;
}) {
  const getStepIcon = (type: NextStep['type']) => {
    switch (type) {
      case 'action':
        return CheckCircle;
      case 'document':
        return FileText;
      case 'communication':
        return Phone;
      case 'review':
        return User;
      case 'wait':
        return Clock;
      default:
        return ArrowRight;
    }
  };

  const getPriorityColor = (priority: NextStep['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssigneeIcon = (type: NextStep['assignee']['type']) => {
    switch (type) {
      case 'user':
        return User;
      case 'ai':
        return Bot;
      default:
        return CheckCircle;
    }
  };

  const getDaysUntilDeadline = (deadline?: Date) => {
    if (!deadline) return null;
    const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const sortedSteps = [...steps].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    className="justify-start"
                    onClick={action.onClick}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recommended Next Steps</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {steps.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSteps.map((step) => {
              const StepIcon = getStepIcon(step.type);
              const AssigneeIcon = getAssigneeIcon(step.assignee.type);
              const daysUntilDeadline = getDaysUntilDeadline(step.deadline);

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border ${
                    step.priority === 'urgent' ? 'border-red-200 bg-red-50' : 'bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(step.priority)}`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {step.title}
                            {step.aiRecommended && (
                              <Badge variant="secondary" className="text-xs">
                                AI {step.confidence ? `${Math.round(step.confidence * 100)}%` : ''}
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        <Badge
                          variant={step.priority === 'urgent' ? 'destructive' : 'outline'}
                          className="ml-2"
                        >
                          {step.priority}
                        </Badge>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <AssigneeIcon className="h-4 w-4" />
                          <span>{step.assignee.name}</span>
                        </div>
                        
                        {step.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{step.estimatedTime}</span>
                          </div>
                        )}
                        
                        {step.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className={daysUntilDeadline! <= 3 ? 'text-amber-600' : ''}>
                              {daysUntilDeadline === 0
                                ? 'Due today'
                                : daysUntilDeadline! < 0
                                ? 'Overdue'
                                : `Due in ${daysUntilDeadline} days`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Impact */}
                      <div className="p-2 rounded bg-secondary/50 text-sm mb-3">
                        <span className="font-medium">Impact: </span>
                        {step.impact}
                      </div>

                      {/* Prerequisites */}
                      {step.prerequisites && step.prerequisites.length > 0 && (
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-medium">Prerequisites: </span>
                            <span className="text-muted-foreground">
                              {step.prerequisites.join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {onStartStep && (
                          <Button
                            size="sm"
                            onClick={() => onStartStep(step.id)}
                            disabled={step.prerequisites && step.prerequisites.length > 0}
                          >
                            Start Now
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                        {onDismissStep && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismissStep(step.id)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {steps.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  All caught up! No immediate actions required.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <p>
                Based on similar cases, completing document submission within the next 48 hours 
                increases approval likelihood by 23%.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <p>
                The servicer typically responds within 3-5 business days. 
                Consider preparing follow-up documentation now.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              <p>
                Your current pace suggests completion 2 days ahead of schedule. 
                Maintain momentum on high-priority items.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}