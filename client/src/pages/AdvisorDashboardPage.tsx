import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Users, FileText, MessageSquare, TrendingUp, Calendar, Clock } from 'lucide-react';

export const AdvisorDashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advisor Dashboard</h1>
          <p className="text-muted-foreground">Monitor client transactions and provide guidance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/notifications">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
          </Link>
          <Link href="/transactions">
            <Button className="bg-primary hover:bg-primary/90">
              View All Transactions
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month Closings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">-30min improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Actions</CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'Document Review', client: 'Johnson Transaction', urgency: 'High', time: '2 hours ago' },
              { type: 'Client Message', client: 'Smith Property', urgency: 'Medium', time: '4 hours ago' },
              { type: 'Status Update', client: 'Davis Short Sale', urgency: 'Low', time: '1 day ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-muted-foreground">{item.client}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <Badge variant={item.urgency === 'High' ? 'destructive' : item.urgency === 'Medium' ? 'default' : 'secondary'}>
                    {item.urgency}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common advisor tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/transactions">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 w-full">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Review Docs</span>
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 w-full">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs">Messages</span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 w-full">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 w-full">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Clients</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest client interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'Document approved', client: 'Wilson Transaction', time: '1h ago' },
                { action: 'Message sent', client: 'Brown Property', time: '3h ago' },
                { action: 'Status updated', client: 'Taylor Short Sale', time: '5h ago' },
                { action: 'Review completed', client: 'Anderson Deal', time: '1d ago' },
              ].map((activity, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.client}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};