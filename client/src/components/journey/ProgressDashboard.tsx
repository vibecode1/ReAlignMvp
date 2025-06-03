import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Activity, Target,
  Clock, Calendar, Users, FileText,
  CheckCircle, AlertTriangle, XCircle, Info
} from 'lucide-react';

interface ProgressMetrics {
  overallProgress: number;
  phasesCompleted: number;
  totalPhases: number;
  documentsSubmitted: number;
  documentsRequired: number;
  daysElapsed: number;
  daysRemaining: number;
  velocity: number; // progress per day
  healthScore: number; // 0-100
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Contributor {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  contribution: string;
  lastActive: Date;
}

/**
 * ProgressDashboard: Comprehensive case progress overview
 * 
 * Features:
 * 1. Real-time progress metrics
 * 2. Health indicators
 * 3. Velocity tracking
 * 4. Smart alerts
 * 5. Contributor activity
 */
export function ProgressDashboard({
  metrics,
  alerts,
  contributors,
  onViewDetails
}: {
  metrics: ProgressMetrics;
  alerts: Alert[];
  contributors: Contributor[];
  onViewDetails?: () => void;
}) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'Critical';
  };

  const getVelocityTrend = (velocity: number) => {
    if (velocity > 2) return { icon: TrendingUp, color: 'text-green-600', label: 'Ahead of schedule' };
    if (velocity < 1) return { icon: TrendingDown, color: 'text-red-600', label: 'Behind schedule' };
    return { icon: Activity, color: 'text-blue-600', label: 'On track' };
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const velocityInfo = getVelocityTrend(metrics.velocity);
  const VelocityIcon = velocityInfo.icon;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallProgress}%</div>
            <Progress value={metrics.overallProgress} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Case Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(metrics.healthScore)}`}>
              {metrics.healthScore}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getHealthLabel(metrics.healthScore)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.daysRemaining}</div>
            <p className="text-sm text-muted-foreground mt-1">
              days until closing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <VelocityIcon className={`h-5 w-5 ${velocityInfo.color}`} />
              <span className="text-2xl font-bold">{metrics.velocity.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {velocityInfo.label}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progress Breakdown</CardTitle>
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phases Completed</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.phasesCompleted} of {metrics.totalPhases}
                </span>
              </div>
              <Progress 
                value={(metrics.phasesCompleted / metrics.totalPhases) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Documents Submitted</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.documentsSubmitted} of {metrics.documentsRequired}
                </span>
              </div>
              <Progress 
                value={(metrics.documentsSubmitted / metrics.documentsRequired) * 100} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Timeline Progress</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Day {metrics.daysElapsed} of {metrics.daysElapsed + metrics.daysRemaining}
                </span>
              </div>
              <Progress 
                value={(metrics.daysElapsed / (metrics.daysElapsed + metrics.daysRemaining)) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                        {alert.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 mt-2"
                            onClick={alert.action.onClick}
                          >
                            {alert.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Contributors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Contributors</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contributors.map((contributor) => (
              <div key={contributor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {contributor.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">{contributor.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{contributor.contribution}</p>
                  <p className="text-xs text-muted-foreground">
                    Active {getRelativeTime(contributor.lastActive)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}