import { CheckCircle2, XCircle, AlertTriangle, Info, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'pending' | 'skipped';
  message?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'completeness' | 'accuracy' | 'consistency' | 'compliance' | 'format';
}

interface ValidationResult {
  documentId: string;
  documentType: string;
  validatedAt: Date;
  overallStatus: 'valid' | 'invalid' | 'partial' | 'pending';
  score: number; // 0-100
  rules: ValidationRule[];
  autoFixAvailable?: boolean;
  fixedIssues?: string[];
}

interface ValidationStatusProps {
  result: ValidationResult;
  onRevalidate?: () => void;
  onAutoFix?: () => void;
  showDetails?: boolean;
  className?: string;
}

const statusConfig = {
  valid: {
    label: 'Valid',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  invalid: {
    label: 'Invalid',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  partial: {
    label: 'Partially Valid',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  pending: {
    label: 'Validation Pending',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  }
};

const ruleStatusConfig = {
  passed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  pending: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  skipped: {
    icon: Info,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
};

const categoryLabels = {
  completeness: 'Completeness',
  accuracy: 'Accuracy',
  consistency: 'Consistency',
  compliance: 'Compliance',
  format: 'Format'
};

export function ValidationStatus({
  result,
  onRevalidate,
  onAutoFix,
  showDetails = true,
  className
}: ValidationStatusProps) {
  const status = statusConfig[result.overallStatus];
  const StatusIcon = status.icon;

  const rulesByCategory = result.rules.reduce((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, ValidationRule[]>);

  const criticalFailures = result.rules.filter(
    r => r.status === 'failed' && r.severity === 'critical'
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 70) return 'bg-amber-600';
    return 'bg-red-600';
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={cn("w-5 h-5", status.color)} />
              Validation Status
            </CardTitle>
            <CardDescription>
              Document type: {result.documentType}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                status.color,
                status.bgColor,
                status.borderColor,
                "border"
              )}
            >
              {status.label}
            </Badge>
            {onRevalidate && (
              <Button variant="outline" size="sm" onClick={onRevalidate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Revalidate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Validation Score</span>
            <span className={cn("text-2xl font-bold", getScoreColor(result.score))}>
              {result.score}%
            </span>
          </div>
          <Progress 
            value={result.score} 
            className="h-3"
            indicatorClassName={getProgressColor(result.score)}
          />
        </div>

        {/* Critical Issues Alert */}
        {criticalFailures.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Issues Found</AlertTitle>
            <AlertDescription>
              {criticalFailures.length} critical validation failure{criticalFailures.length > 1 ? 's' : ''} detected:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {criticalFailures.map(rule => (
                  <li key={rule.id} className="text-sm">
                    {rule.name}: {rule.message || rule.description}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-fix Available */}
        {result.autoFixAvailable && onAutoFix && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Auto-fix Available</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Some validation issues can be automatically resolved</span>
              <Button size="sm" onClick={onAutoFix} className="ml-4">
                Apply Auto-fix
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Fixed Issues */}
        {result.fixedIssues && result.fixedIssues.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Issues Fixed</AlertTitle>
            <AlertDescription className="text-green-800">
              The following issues were automatically resolved:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {result.fixedIssues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Rules by Category */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Validation Details</h4>
            {Object.entries(rulesByCategory).map(([category, rules]) => (
              <div key={category} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2">
                  <h5 className="text-sm font-medium">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h5>
                </div>
                <div className="divide-y">
                  {rules.map(rule => {
                    const ruleStatus = ruleStatusConfig[rule.status];
                    const RuleIcon = ruleStatus.icon;

                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          "px-3 py-2 flex items-start gap-3",
                          ruleStatus.bgColor
                        )}
                      >
                        <RuleIcon className={cn("w-4 h-4 mt-0.5", ruleStatus.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{rule.name}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                rule.severity === 'critical' && "border-red-600 text-red-600",
                                rule.severity === 'high' && "border-orange-600 text-orange-600",
                                rule.severity === 'medium' && "border-amber-600 text-amber-600",
                                rule.severity === 'low' && "border-gray-600 text-gray-600"
                              )}
                            >
                              {rule.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {rule.message || rule.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          {Object.entries(
            result.rules.reduce((acc, rule) => {
              acc[rule.status] = (acc[rule.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([status, count]) => {
            const config = ruleStatusConfig[status as keyof typeof ruleStatusConfig];
            const Icon = config.icon;
            
            return (
              <div key={status} className="text-center">
                <Icon className={cn("w-5 h-5 mx-auto mb-1", config.color)} />
                <p className="text-xs text-muted-foreground capitalize">{status}</p>
                <p className="text-sm font-semibold">{count}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}