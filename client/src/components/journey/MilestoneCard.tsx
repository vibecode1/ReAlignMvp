import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, Circle, AlertCircle, Clock,
  Calendar, Target, TrendingUp, Users
} from 'lucide-react';

interface MilestoneTask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  dueDate?: Date;
}

interface MilestoneData {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  progress: number;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  tasks: MilestoneTask[];
  dependencies: string[];
  blockers?: string[];
  owner: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * MilestoneCard: Detailed milestone tracking component
 * 
 * Features:
 * 1. Task breakdown
 * 2. Progress visualization
 * 3. Timeline tracking
 * 4. Dependency management
 * 5. Blocker highlighting
 */
export function MilestoneCard({
  milestone,
  onUpdateTask,
  onViewDetails,
  compact = false
}: {
  milestone: MilestoneData;
  onUpdateTask?: (taskId: string, completed: boolean) => void;
  onViewDetails?: () => void;
  compact?: boolean;
}) {
  const getStatusIcon = () => {
    switch (milestone.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      blocked: 'destructive'
    } as const;

    return (
      <Badge variant={variants[milestone.status]}>
        {milestone.status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = () => {
    const variants = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;

    return (
      <Badge variant={variants[milestone.priority]} className="ml-2">
        {milestone.priority}
      </Badge>
    );
  };

  const getDaysRemaining = () => {
    if (milestone.completedDate) return null;
    const days = Math.ceil((milestone.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getTimelineStatus = () => {
    const daysRemaining = getDaysRemaining();
    if (daysRemaining === null) return null;
    
    if (daysRemaining < 0) return { label: 'Overdue', color: 'text-red-600' };
    if (daysRemaining === 0) return { label: 'Due today', color: 'text-amber-600' };
    if (daysRemaining <= 3) return { label: `${daysRemaining} days left`, color: 'text-amber-600' };
    return { label: `${daysRemaining} days left`, color: 'text-gray-600' };
  };

  const completedTasks = milestone.tasks.filter(t => t.completed).length;
  const taskProgress = milestone.tasks.length > 0 
    ? (completedTasks / milestone.tasks.length) * 100 
    : 0;

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <CardTitle className="text-base">{milestone.title}</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={milestone.progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedTasks}/{milestone.tasks.length} tasks
              </span>
              {getTimelineStatus() && (
                <span className={getTimelineStatus()!.color}>
                  {getTimelineStatus()!.label}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <CardTitle>{milestone.title}</CardTitle>
              {getPriorityBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {milestone.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{milestone.progress}%</span>
          </div>
          <Progress value={milestone.progress} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Start Date</p>
            <p className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {milestone.startDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Target Date</p>
            <p className="font-medium flex items-center">
              <Target className="h-4 w-4 mr-1" />
              {milestone.targetDate.toLocaleDateString()}
            </p>
            {getTimelineStatus() && (
              <p className={`text-xs mt-1 ${getTimelineStatus()!.color}`}>
                {getTimelineStatus()!.label}
              </p>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Tasks ({completedTasks}/{milestone.tasks.length})</h4>
            <Progress value={taskProgress} className="w-20 h-1" />
          </div>
          <div className="space-y-2">
            {milestone.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded hover:bg-secondary/50"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateTask?.(task.id, !task.completed)}
                    className="p-0.5"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {task.assignee && <span>{task.assignee}</span>}
                  {task.dueDate && (
                    <span>{task.dueDate.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        {milestone.blockers && milestone.blockers.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-2">Blockers</h4>
            <ul className="space-y-1">
              {milestone.blockers.map((blocker, index) => (
                <li key={index} className="text-sm text-red-700">
                  • {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Owner: {milestone.owner}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Phase: {milestone.phase}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}