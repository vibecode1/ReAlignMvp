import React from 'react';
import { FileText, Calculator, Phone, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContextCardProps {
  context: {
    type: string;
    title: string;
    details?: Record<string, any>;
    relatedDocuments?: string[];
    nextSteps?: string[];
  };
  className?: string;
}

export function ContextCard({ context, className }: ContextCardProps) {
  const getIcon = () => {
    switch (context.type) {
      case 'document': return FileText;
      case 'calculation': return Calculator;
      case 'communication': return Phone;
      default: return AlertCircle;
    }
  };

  const Icon = getIcon();

  return (
    <Card className={cn('p-3 bg-muted/50', className)}>
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{context.title}</h4>
            <Badge variant="secondary" className="text-xs">
              {context.type}
            </Badge>
          </div>
          
          {context.details && (
            <div className="space-y-1">
              {Object.entries(context.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
          
          {context.relatedDocuments && context.relatedDocuments.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Related documents:</p>
              <div className="flex flex-wrap gap-1">
                {context.relatedDocuments.map((doc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {context.nextSteps && context.nextSteps.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Suggested next steps:</p>
              <ul className="space-y-1">
                {context.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-1">
                    <span className="text-muted-foreground">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}