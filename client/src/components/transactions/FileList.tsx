import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, MoreVertical, Eye, EyeOff, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface Upload {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  visibility: 'private' | 'shared';
  uploadedAt: string;
}

interface FileListProps {
  uploads: Upload[];
  transactionId: string;
  currentUserRole: string;
  currentUserId: string;
}

const FileList: React.FC<FileListProps> = ({ 
  uploads, 
  transactionId, 
  currentUserRole, 
  currentUserId 
}) => {
  const [loadingVisibility, setLoadingVisibility] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleVisibilityToggle = async (uploadId: string, currentVisibility: string) => {
    if (currentUserRole !== 'negotiator') {
      toast({
        title: "Access Denied",
        description: "Only negotiators can change file visibility.",
        variant: "destructive",
      });
      return;
    }

    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';
    setLoadingVisibility(uploadId);

    try {
      await apiRequest('PATCH', `/api/v1/uploads/${uploadId}/visibility`, {
        visibility: newVisibility
      });

      toast({
        title: "Visibility Updated",
        description: `File is now ${newVisibility}.`,
      });

      // Refresh the transaction data
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
    } catch (error) {
      console.error('Failed to update file visibility:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the file visibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingVisibility(null);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!uploads || uploads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div 
              key={upload.id} 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{upload.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {upload.docType} • {new Date(upload.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={upload.visibility === 'shared' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {upload.visibility === 'shared' ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Shared
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleDownload(upload.fileUrl, upload.fileName)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    {currentUserRole === 'negotiator' && (
                      <DropdownMenuItem 
                        onClick={() => handleVisibilityToggle(upload.id, upload.visibility)}
                        disabled={loadingVisibility === upload.id}
                      >
                        {upload.visibility === 'private' ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Make Shared
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Make Private
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileList;