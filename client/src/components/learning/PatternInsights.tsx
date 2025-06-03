import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PatternInsightsProps {
  caseId: string;
  className?: string;
}

export function PatternInsights({ caseId, className }: PatternInsightsProps) {
  // Mock data - would be fetched based on caseId
  const insights = {
    similarCases: 847,
    successRate: 0.78,
    averageTimeToResolution: '47 days',
    keyFactors: [
      { factor: 'Complete documentation on first submission', impact: 0.92 },
      { factor: 'Response within 24 hours to servicer requests', impact: 0.87 },
      { factor: 'Stable income documentation', impact: 0.83 },
      { factor: 'Hardship letter clarity', impact: 0.79 },
    ],
    risks: [
      { risk: 'Missing second pay stub', severity: 'medium' },
      { risk: 'Approaching deadline (7 days)', severity: 'high' },
    ],
    recommendations: [
      'Upload second recent pay stub to strengthen application',
      'Prepare bank statements for last 3 months',
      'Schedule follow-up call with servicer for Thursday',
    ],
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-lavender-mist/10 to-purple-glow/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lavender-mist" />
            AI Pattern Analysis
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users size={12} />
            {insights.similarCases} similar cases
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        {/* Success Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Predicted Success Rate</span>
            <span className="text-2xl font-bold text-sage-green">
              {Math.round(insights.successRate * 100)}%
            </span>
          </div>
          <Progress value={insights.successRate * 100} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            Average time to resolution: {insights.averageTimeToResolution}
          </p>
        </div>
        
        {/* Key Success Factors */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sage-green" />
            Key Success Factors
          </h4>
          <div className="space-y-2">
            {insights.keyFactors.map((factor, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-sage-green" />
                  <span className="text-sm">{factor.factor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-background rounded-full h-2">
                    <div 
                      className="h-full bg-sage-green rounded-full"
                      style={{ width: `${factor.impact * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(factor.impact * 100)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Risk Indicators */}
        {insights.risks.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warm-amber" />
              Risk Indicators
            </h4>
            <div className="space-y-2">
              {insights.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg',
                    risk.severity === 'high' && 'bg-autumn-glow/10 border border-autumn-glow/20',
                    risk.severity === 'medium' && 'bg-warm-amber/10 border border-warm-amber/20',
                    risk.severity === 'low' && 'bg-muted'
                  )}
                >
                  <span className="text-sm">{risk.risk}</span>
                  <Badge 
                    variant={risk.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {risk.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Recommendations */}
        <div>
          <h4 className="font-medium mb-3">Recommended Next Steps</h4>
          <div className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                className="flex items-start gap-2 p-3 bg-lavender-mist/5 rounded-lg border border-lavender-mist/20"
              >
                <div className="w-6 h-6 rounded-full bg-lavender-mist/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">{idx + 1}</span>
                </div>
                <p className="text-sm flex-1">{rec}</p>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* View Details Button */}
        <Button variant="outline" className="w-full" size="sm">
          View Detailed Analysis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}