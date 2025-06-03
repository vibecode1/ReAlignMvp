import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, FileText, Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { useEmotionalState } from '@/components/layout/AIAppShell';
import { PatternInsights } from '@/components/learning/PatternInsights';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';

const mockCases = [
  {
    id: '123456',
    borrowerName: 'John Smith',
    status: 'In Progress',
    progress: 65,
    lastActivity: '2 hours ago',
    daysInProcess: 15,
    nextDeadline: 'Submit hardship letter by Feb 5',
    servicer: 'Wells Fargo',
    type: 'Loan Modification'
  },
  {
    id: '123457',
    borrowerName: 'Sarah Johnson',
    status: 'Document Collection',
    progress: 35,
    lastActivity: '1 day ago',
    daysInProcess: 7,
    nextDeadline: 'Upload bank statements',
    servicer: 'Bank of America',
    type: 'Forbearance'
  }
];

export default function CasesPage() {
  const { setState } = useEmotionalState();

  React.useEffect(() => {
    // Set emotional state based on page content
    setState('hopeful');
  }, [setState]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-deep-ocean">Loss Mitigation Cases</h1>
          <p className="text-muted-foreground mt-1">
            Managing {mockCases.length} active cases with AI assistance
          </p>
        </div>
        <Button className="bg-calm-sky hover:bg-calm-sky/90">
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCases.length}</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Success Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-green">78%</div>
            <p className="text-xs text-muted-foreground">Above average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Resolution Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47 days</div>
            <p className="text-xs text-muted-foreground">12 days faster</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Documents Processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">98% accurate</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Cases List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-h3 font-semibold">Active Cases</h2>
          
          {mockCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{case_.borrowerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Case #{case_.id} • {case_.type}
                    </p>
                  </div>
                  <Badge variant={case_.status === 'In Progress' ? 'default' : 'secondary'}>
                    {case_.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Progress</span>
                    <span className="text-sm font-medium">{case_.progress}%</span>
                  </div>
                  <Progress value={case_.progress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{case_.lastActivity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{case_.daysInProcess} days</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-sm">
                      <span className="font-medium">Next: </span>
                      <span className="text-warm-amber">{case_.nextDeadline}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pattern Insights */}
        <div className="space-y-4">
          <h2 className="text-h3 font-semibold">AI Insights</h2>
          <PatternInsights caseId="123456" />
        </div>
      </div>
    </div>
  );
}