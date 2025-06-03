import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'analyzing' | 'processing' | 'complete' | 'error';
  progress: number;
  documentType?: string;
  confidence?: number;
  extractedData?: any;
  error?: string;
  warnings?: string[];
}

interface SmartUploadProps {
  caseId: string;
  onFilesProcessed?: (files: ProcessedFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  className?: string;
}

interface ProcessedFile {
  id: string;
  fileName: string;
  documentType: string;
  extractedData: any;
  confidence: number;
  warnings: string[];
}

const documentTypeIcons: Record<string, string> = {
  'paystub': '💵',
  'bank_statement': '🏦',
  'tax_return': '📋',
  'hardship_letter': '📝',
  'identification': '🆔',
  'mortgage_statement': '🏠',
  'utility_bill': '💡',
  'insurance': '🛡️',
  'unknown': '📄'
};

export function SmartUpload({
  caseId,
  onFilesProcessed,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  className
}: SmartUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'analyzing', progress: 10 }
        : f
    ));

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('caseId', caseId);

      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const { documentId } = await uploadResponse.json();

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing', progress: 40 }
          : f
      ));

      // Step 2: Process with AI
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, caseId })
      });

      if (!processResponse.ok) throw new Error('Processing failed');

      const result = await processResponse.json();

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? {
              ...f,
              status: 'complete',
              progress: 100,
              documentType: result.type,
              confidence: result.confidence,
              extractedData: result.extracted,
              warnings: result.warnings || []
            }
          : f
      ));

      return result;

    } catch (error) {
      console.error('Error processing file:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : f
      ));
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(true);

    const results: ProcessedFile[] = [];

    for (const uploadFile of newFiles) {
      try {
        const result = await processFile(uploadFile);
        results.push({
          id: uploadFile.id,
          fileName: uploadFile.file.name,
          documentType: result.type,
          extractedData: result.extracted,
          confidence: result.confidence,
          warnings: result.warnings || []
        });
      } catch (error) {
        // Error already handled in processFile
      }
    }

    setIsProcessing(false);

    if (results.length > 0 && onFilesProcessed) {
      onFilesProcessed(results);
    }
  }, [caseId, onFilesProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles - files.length,
    disabled: isProcessing || files.length >= maxFiles
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'pending', progress: 0, error: undefined }
        : f
    ));
    await processFile(uploadFile);
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? "Drop files here" : "Drag & drop documents"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse your files
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Accepted: {acceptedTypes.join(', ')}</span>
            <span>•</span>
            <span>Max size: {formatBytes(maxFileSize)}</span>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="text-2xl">
                  {file.documentType 
                    ? documentTypeIcons[file.documentType] || documentTypeIcons.unknown
                    : <FileText className="w-6 h-6 text-muted-foreground" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {file.file.name}
                    </p>
                    {file.documentType && (
                      <Badge variant="secondary" className="text-xs">
                        {file.documentType.replace('_', ' ')}
                      </Badge>
                    )}
                    {file.confidence !== undefined && (
                      <Badge 
                        variant={file.confidence > 0.8 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {Math.round(file.confidence * 100)}% confident
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(file.file.size)}
                    </span>

                    {file.status === 'analyzing' && (
                      <span className="text-xs text-blue-600">Analyzing document...</span>
                    )}
                    {file.status === 'processing' && (
                      <span className="text-xs text-blue-600">Extracting data...</span>
                    )}
                    {file.status === 'complete' && (
                      <span className="text-xs text-green-600">Processing complete</span>
                    )}
                    {file.status === 'error' && (
                      <span className="text-xs text-red-600">{file.error}</span>
                    )}
                  </div>

                  {(file.status === 'analyzing' || file.status === 'processing') && (
                    <Progress value={file.progress} className="h-1 mt-2" />
                  )}

                  {file.warnings && file.warnings.length > 0 && (
                    <Alert className="mt-2 py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {file.warnings[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'pending' && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {file.status === 'analyzing' || file.status === 'processing' && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                  {file.status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => retryFile(file)}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'analyzing' || file.status === 'processing'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length >= maxFiles && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum number of files ({maxFiles}) reached
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}