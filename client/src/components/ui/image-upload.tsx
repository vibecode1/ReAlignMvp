import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in MB
  accept?: string;
  label?: string;
  isUploading?: boolean;
  error?: string;
}

export function ImageUpload({
  onFileSelect,
  maxSize = 10, // 10MB default
  accept = "image/*,application/pdf",
  label = "Upload File",
  isUploading = false,
  error
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
    
    // Set the original file for preview
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    
    // If it's an image and larger than 1MB, compress it
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      try {
        setIsCompressing(true);
        
        const options = {
          maxSizeMB: Math.min(maxSize, 2), // max 2MB after compression
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        
        const compressedFile = await imageCompression(file, options);
        
        // Update with the compressed file
        setSelectedFile(compressedFile);
        onFileSelect(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original file
        onFileSelect(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // Use the original file for non-images or small images
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isUploading}
      />
      
      {!selectedFile ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-all"
          onClick={handleButtonClick}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
          <p className="mt-1 text-xs text-gray-500">
            Max size: {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="border rounded-lg p-3">
            <div className="flex items-start gap-3">
              {previewUrl && file.type.startsWith('image/') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                  <span className="text-xs text-gray-500 text-center overflow-hidden">
                    {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                
                {isCompressing && (
                  <div className="mt-1 flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-primary"></div>
                    <span className="text-xs text-gray-500">Compressing...</span>
                  </div>
                )}
                
                {isUploading && (
                  <div className="mt-1 flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-primary"></div>
                    <span className="text-xs text-gray-500">Uploading...</span>
                  </div>
                )}
                
                {error && (
                  <div className="mt-1 flex items-center text-red-500">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">{error}</span>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedFile && (
        <Button
          type="button"
          onClick={handleButtonClick}
          className="mt-2"
          disabled={isUploading}
        >
          <UploadCloud className="h-4 w-4 mr-2" />
          Select File
        </Button>
      )}
    </div>
  );
}
