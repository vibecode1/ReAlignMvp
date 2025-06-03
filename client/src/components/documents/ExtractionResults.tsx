import { useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ConfidenceIndicator } from '@/components/ai/ConfidenceIndicator';

interface ExtractedField {
  name: string;
  value: any;
  confidence: number;
  source?: string;
  validated?: boolean;
  warning?: string;
}

interface ExtractionResult {
  documentType: string;
  fileName: string;
  extractedAt: Date;
  overallConfidence: number;
  fields: ExtractedField[];
  metadata?: {
    pages?: number;
    language?: string;
    quality?: 'high' | 'medium' | 'low';
  };
  validationErrors?: string[];
  suggestions?: string[];
}

interface ExtractionResultsProps {
  results: ExtractionResult[];
  onFieldEdit?: (documentIndex: number, fieldName: string, newValue: any) => void;
  onExport?: (format: 'json' | 'csv') => void;
  className?: string;
}

function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (value % 1 === 0) return value.toString();
    return value.toFixed(2);
  }
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return value.toString();
}

function FieldRow({ field, onCopy }: { field: ExtractedField; onCopy: (value: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(formatFieldValue(field.value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{field.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{formatFieldValue(field.value)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <ConfidenceIndicator confidence={field.confidence} size="sm" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {field.validated ? (
            <Badge variant="default" className="text-xs">Validated</Badge>
          ) : field.warning ? (
            <Badge variant="destructive" className="text-xs">Warning</Badge>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ExtractionResults({
  results,
  onFieldEdit,
  onExport,
  className
}: ExtractionResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState('0');

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No extraction results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Extraction Results</CardTitle>
            <CardDescription>
              {results.length} document{results.length > 1 ? 's' : ''} processed
            </CardDescription>
          </div>
          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('json')}
              >
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
              >
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {results.length === 1 ? (
          <SingleDocumentView 
            result={results[0]} 
            onFieldEdit={onFieldEdit ? (field, value) => onFieldEdit(0, field, value) : undefined}
            onCopy={copyToClipboard}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              {results.slice(0, 4).map((result, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {result.documentType}
                </TabsTrigger>
              ))}
            </TabsList>

            {results.map((result, index) => (
              <TabsContent key={index} value={index.toString()}>
                <SingleDocumentView 
                  result={result} 
                  onFieldEdit={onFieldEdit ? (field, value) => onFieldEdit(index, field, value) : undefined}
                  onCopy={copyToClipboard}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function SingleDocumentView({ 
  result, 
  onFieldEdit, 
  onCopy 
}: { 
  result: ExtractionResult; 
  onFieldEdit?: (field: string, value: any) => void;
  onCopy: (value: string) => void;
}) {
  const [showAllFields, setShowAllFields] = useState(false);
  
  const highConfidenceFields = result.fields.filter(f => f.confidence >= 0.8);
  const lowConfidenceFields = result.fields.filter(f => f.confidence < 0.8);
  const fieldsToShow = showAllFields ? result.fields : highConfidenceFields;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="font-medium">{result.fileName}</p>
            <p className="text-sm text-muted-foreground">
              Extracted on {new Date(result.extractedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceIndicator 
            confidence={result.overallConfidence} 
            showLabel 
            context="Overall extraction confidence"
          />
        </div>
      </div>

      {/* Metadata */}
      {result.metadata && (
        <div className="flex gap-2">
          {result.metadata.pages && (
            <Badge variant="secondary">{result.metadata.pages} pages</Badge>
          )}
          {result.metadata.language && (
            <Badge variant="secondary">{result.metadata.language}</Badge>
          )}
          {result.metadata.quality && (
            <Badge 
              variant={result.metadata.quality === 'high' ? 'default' : 'secondary'}
            >
              {result.metadata.quality} quality
            </Badge>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {result.validationErrors && result.validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {result.validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Extracted Fields */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fieldsToShow.map((field, index) => (
              <FieldRow key={index} field={field} onCopy={onCopy} />
            ))}
          </TableBody>
        </Table>
        
        {lowConfidenceFields.length > 0 && !showAllFields && (
          <div className="p-2 border-t bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFields(true)}
              className="w-full"
            >
              Show {lowConfidenceFields.length} low confidence fields
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        
        {showAllFields && lowConfidenceFields.length > 0 && (
          <div className="p-2 border-t bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFields(false)}
              className="w-full"
            >
              Hide low confidence fields
              <ChevronUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {result.suggestions && result.suggestions.length > 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}