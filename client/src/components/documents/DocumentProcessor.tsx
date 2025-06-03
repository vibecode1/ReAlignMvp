import { useState, useEffect } from 'react';
import { FileText, Loader2, CheckCircle2, AlertTriangle, Eye, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
  timestamp?: Date;
}

interface DocumentData {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  documentType?: string;
  status: 'uploaded' | 'analyzing' | 'processing' | 'complete' | 'error';
  steps: ProcessingStep[];
  extractedData?: any;
  confidence?: number;
  warnings?: string[];
  errors?: string[];
}

interface DocumentProcessorProps {
  documentId: string;
  onProcessingComplete?: (data: any) => void;
  showPreview?: boolean;
  className?: string;
}

const processingSteps = [
  { key: 'upload', name: 'Document Upload' },
  { key: 'type_detection', name: 'Document Type Detection' },
  { key: 'ocr', name: 'Text Extraction (OCR)' },
  { key: 'data_extraction', name: 'Data Extraction' },
  { key: 'validation', name: 'Validation' },
  { key: 'storage', name: 'Secure Storage' }
];

export function DocumentProcessor({
  documentId,
  onProcessingComplete,
  showPreview = true,
  className
}: DocumentProcessorProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

  useEffect(() => {
    loadDocument();
    const interval = setInterval(() => {
      if (document?.status !== 'complete' && document?.status !== 'error') {
        loadDocument();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [documentId, document?.status]);

  const loadDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) throw new Error('Failed to load document');
      
      const data = await response.json();
      setDocument(data);
      
      if (data.status === 'complete' && onProcessingComplete) {
        onProcessingComplete(data.extractedData);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/reprocess`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reprocess document');
      
      await loadDocument();
    } catch (error) {
      console.error('Error reprocessing document:', error);
    }
  };

  const downloadExtractedData = () => {
    if (!document?.extractedData) return;

    const blob = new Blob([JSON.stringify(document.extractedData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.fileName.split('.')[0]}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Document not found</AlertTitle>
            <AlertDescription>
              The requested document could not be found.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = document.steps.filter(s => s.status === 'complete').length;
  const progressPercentage = (completedSteps / processingSteps.length) * 100;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {document.fileName}
            </CardTitle>
            <CardDescription>
              {formatBytes(document.fileSize)} • Uploaded {new Date(document.uploadedAt).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {document.documentType && (
              <Badge variant="secondary">
                {document.documentType.replace('_', ' ')}
              </Badge>
            )}
            <Badge
              variant={
                document.status === 'complete' ? 'default' :
                document.status === 'error' ? 'destructive' :
                'secondary'
              }
            >
              {document.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="data" disabled={!document.extractedData}>
              Extracted Data
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!showPreview}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="space-y-3">
              {processingSteps.map((stepConfig) => {
                const step = document.steps.find(s => s.name === stepConfig.name) || {
                  name: stepConfig.name,
                  status: 'pending' as const
                };

                return (
                  <div key={stepConfig.key} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {step.status === 'complete' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {step.status === 'processing' && (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {step.status === 'error' && (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          step.status === 'pending' && "text-muted-foreground"
                        )}>
                          {step.name}
                        </span>
                        {step.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      {step.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {document.warnings && document.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {document.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {document.status === 'error' && document.errors && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Processing Error</AlertTitle>
                <AlertDescription>
                  {document.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              {document.status === 'error' && (
                <Button onClick={reprocessDocument} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Processing
                </Button>
              )}
              {document.extractedData && (
                <Button onClick={downloadExtractedData} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Data
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            {document.extractedData && (
              <div className="space-y-4">
                {document.confidence !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Extraction Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={document.confidence * 100} className="w-24 h-2" />
                      <span className="text-sm font-medium">
                        {Math.round(document.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 bg-muted/30">
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(document.extractedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg bg-muted/30 p-8 text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Document preview will be displayed here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}