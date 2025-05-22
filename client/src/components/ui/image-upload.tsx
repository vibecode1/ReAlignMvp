import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertTriangle, Image, File, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import compressImage from 'browser-image-compression';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setSuccess(false);
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`File type ${file.type} is not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }
    
    try {
      let fileToUpload = file;
      
      // If it's an image, compress it
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: Math.min(maxSizeMB, 1), // Max 1MB for images
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        fileToUpload = await compressImage(file, options);
      }
      
      setSelectedFile(fileToUpload);
      
      // Generate preview for images
      if (fileToUpload.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(fileToUpload);
      } else {
        setPreview(null);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please try again.');
    }
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Create a fake event to reuse the file change handler
    const dummyEvent = {
      target: {
        files: [file]
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileChange(dummyEvent);
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Clear selected file
  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Simulate progress (in a real app, this would come from the upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Perform the actual upload
      await onUpload(selectedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        handleClear();
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-8 w-8 text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (selectedFile.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-amber-500" />;
    }
  };
  
  // For accessibility
  const buttonId = "upload-button";
  const dropzoneId = "file-dropzone";
  
  return (
    <div className={cn("w-full", className)}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={acceptedTypes.join(',')}
        aria-labelledby={buttonId}
      />
      
      {/* Dropzone */}
      <div
        id={dropzoneId}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          "flex flex-col items-center justify-center gap-2",
          "min-h-[200px]",
          error ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : 
          selectedFile ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20" : 
          "border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={selectedFile ? undefined : handleButtonClick}
        role="button"
        aria-controls="fileInput"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!selectedFile) handleButtonClick();
          }
        }}
      >
        {/* Preview area */}
        {preview ? (
          <div className="relative w-full max-w-[200px] h-[150px] mb-2">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-contain rounded"
            />
          </div>
        ) : (
          <div className="mb-2">
            {getFileIcon()}
          </div>
        )}
        
        {/* Content based on state */}
        {error ? (
          <div className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : uploading ? (
          <div className="w-full max-w-xs">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Uploading {selectedFile?.name}...
            </p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {progress}%
            </p>
          </div>
        ) : success ? (
          <div className="text-green-600 dark:text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Upload successful!</span>
          </div>
        ) : selectedFile ? (
          <div className="w-full">
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Drag & drop your file here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Max size: {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;