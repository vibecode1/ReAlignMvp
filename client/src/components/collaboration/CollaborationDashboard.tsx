import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Brain, TrendingUp, Clock, CheckCircle,
  AlertCircle, MessageSquare, Activity, Target
} from 'lucide-react';

interface CollaborationMetrics {
  activeCollaborations: number;
  resolvedToday: number;
  averageResolutionTime: number;
  aiContribution: number;
  expertSatisfaction: number;
  learningImprovements: number;
}

interface ActiveCollaboration {
  id: string;
  escalationId: string;
  expert: string;
  issue: string;
  duration: number;
  aiEngagement: number;
  status: 'active' | 'paused' | 'reviewing';
}

/**
 * CollaborationDashboard: Overview of human-AI collaboration system
 * 
 * Displays:
 * 1. Active collaboration sessions
 * 2. Performance metrics
 * 3. AI contribution analytics
 * 4. Expert workload distribution
 * 5. Learning improvements over time
 */
export function CollaborationDashboard() {
  const [metrics] = useState<CollaborationMetrics>({
    activeCollaborations: 5,
    resolvedToday: 12,
    averageResolutionTime: 28,
    aiContribution: 73,
    expertSatisfaction: 92,
    learningImprovements: 15
  });

  const [activeCollaborations] = useState<ActiveCollaboration[]>([
    {
      id: 'collab_1',
      escalationId: 'esc_123',
      expert: 'Sarah Johnson',
      issue: 'Chase portal submission failures',
      duration: 15,
      aiEngagement: 85,
      status: 'active'
    },
    {
      id: 'collab_2',
      escalationId: 'esc_124',
      expert: 'Michael Chen',
      issue: 'API integration timeout',
      duration: 32,
      aiEngagement: 60,
      status: 'paused'
    },
    {
      id: 'collab_3',
      escalationId: 'esc_125',
      expert: 'Emily Rodriguez',
      issue: 'Document validation errors',
      duration: 8,
      aiEngagement: 90,
      status: 'active'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Collaborations</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCollaborations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.resolvedToday} resolved today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">AI Contribution</CardTitle>
              <Brain className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiContribution}%</div>
            <Progress value={metrics.aiContribution} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resolution Time</CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResolutionTime} min</div>
            <p className="text-xs text-muted-foreground mt-1">
              15% faster than manual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Collaborations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Collaboration Sessions</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCollaborations.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{collab.issue}</h4>
                    <Badge variant={collab.status === 'active' ? 'default' : 'secondary'}>
                      {collab.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{collab.expert}</span>
                    <span>•</span>
                    <span>{collab.duration} min</span>
                    <span>•</span>
                    <span>AI Engagement: {collab.aiEngagement}%</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Join
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expert Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Rating</span>
                <span className="text-2xl font-bold">{metrics.expertSatisfaction}%</span>
              </div>
              <Progress value={metrics.expertSatisfaction} className="h-2" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">AI Helpfulness</p>
                  <p className="font-medium">4.6/5.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Saved</p>
                  <p className="font-medium">32%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Week</span>
                <span className="text-2xl font-bold">+{metrics.learningImprovements}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pattern Recognition</span>
                  <span className="text-green-600">+8%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolution Speed</span>
                  <span className="text-green-600">+5%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="text-green-600">+2%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}