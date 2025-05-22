import React, { useState } from 'react';
import { Upload, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { REQUEST_TEMPLATES } from './DocRequestList';

interface UploadWidgetProps {
  transactionId: string;
  onUploadComplete: (uploadDetails: {
    name: string;
    url: string;
    docType: string;
    visibility: 'private' | 'shared';
  }) => void;
  defaultVisibility?: 'shared' | 'private';
  docType?: string;
  role?: string;
  maxFileSizeMB?: number;
}

export const UploadWidget: React.FC<UploadWidgetProps> = ({
  transactionId,
  onUploadComplete,
  defaultVisibility = 'private',
  docType,
  role,
  maxFileSizeMB = 10
}) => {
  const [visibility, setVisibility] = useState<'private' | 'shared'>(defaultVisibility);
  const [selectedDocType, setSelectedDocType] = useState<string>(docType || '');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Handle upload
  const handleUpload = async (file: File) => {
    if (!selectedDocType) {
      setUploadError('Please select a document type before uploading.');
      return;
    }
    
    try {
      setUploadError(null);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', selectedDocType);
      formData.append('visibility', visibility);
      
      // Call the API to upload the file
      const response = await fetch(`/api/v1/uploads/${transactionId}`, {
        method: 'POST',
        body: formData,
        // No Content-Type header - browser will set it automatically with boundary
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }
      
      const uploadData = await response.json();
      
      // Call the completion handler with upload details
      onUploadComplete({
        name: file.name,
        url: uploadData.fileUrl,
        docType: selectedDocType,
        visibility
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
      throw error; // Re-throw to show error in the upload component
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Document Type Selection */}
        <div className="mb-4">
          <Label htmlFor="doc-type" className="block mb-2">
            Document Type
          </Label>
          <Select 
            value={selectedDocType} 
            onValueChange={setSelectedDocType}
          >
            <SelectTrigger id="doc-type" className="w-full">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TEMPLATES.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Visibility Selection */}
        <div className="mb-6">
          <Label className="block mb-2">
            Visibility
          </Label>
          <RadioGroup 
            value={visibility} 
            onValueChange={(value) => setVisibility(value as 'private' | 'shared')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex items-center cursor-pointer">
                <EyeOff className="h-4 w-4 mr-1" />
                <span>Private</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shared" id="shared" />
              <Label htmlFor="shared" className="flex items-center cursor-pointer">
                <Eye className="h-4 w-4 mr-1" />
                <span>Shared</span>
              </Label>
            </div>
          </RadioGroup>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {visibility === 'private' 
              ? 'Private uploads are only visible to you and the negotiator.' 
              : 'Shared uploads are visible to all transaction participants.'}
          </p>
        </div>
        
        {/* Upload Component */}
        <ImageUpload 
          onUpload={handleUpload}
          maxSizeMB={maxFileSizeMB}
          acceptedTypes={[
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ]}
        />
        
        {/* Error Display */}
        {uploadError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadWidget;