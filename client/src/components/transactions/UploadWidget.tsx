import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Document templates
const REQUEST_TEMPLATES = [
  "Paystubs (30 Days)",
  "Bank Statements (2 Months)",
  "4506-C Form",
  "Short Sale Affidavit",
  "Last 2 Years of Tax Returns",
  "Hardship Letter",
  "Property Insurance",
  "Mortgage Statement",
  "Other Document"
];

interface DocumentRequestInfo {
  id: string;
  docType: string;
  status: 'pending' | 'complete' | 'overdue';
}

interface UploadWidgetProps {
  transactionId: string;
  documentRequests?: DocumentRequestInfo[];
}

export const UploadWidget = ({ 
  transactionId,
  documentRequests = []
}: UploadWidgetProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [documentRequestId, setDocumentRequestId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get pending document requests for the dropdown
  const pendingRequests = documentRequests.filter(req => req.status === 'pending');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    // Try to match document type from requests if not yet selected
    if (!docType && pendingRequests.length > 0) {
      setDocType(pendingRequests[0].docType);
      setDocumentRequestId(pendingRequests[0].id);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docType) {
      setUploadError("Please select a file and document type");
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('docType', docType);
      formData.append('visibility', visibility);
      
      if (documentRequestId) {
        formData.append('documentRequestId', documentRequestId);
      }
      
      const response = await fetch(`/api/v1/uploads/${transactionId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      // Reset form
      setSelectedFile(null);
      setUploadSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/v1/uploads/${transactionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      
      if (documentRequestId) {
        queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/doc-requests`] });
      }
      
      toast({
        title: "Upload Successful",
        description: "Your document was uploaded successfully.",
      });
      
      // Reset form after a delay
      setTimeout(() => {
        setUploadSuccess(false);
        setDocType("");
        setVisibility("private");
        setDocumentRequestId("");
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError("Upload failed. Please try again.");
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestChange = (requestId: string) => {
    setDocumentRequestId(requestId);
    
    // Update docType based on the selected request
    const selectedRequest = pendingRequests.find(req => req.id === requestId);
    if (selectedRequest) {
      setDocType(selectedRequest.docType);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <UploadCloud className="mr-2 h-5 w-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center text-green-600"
          >
            <CheckCircle className="h-16 w-16 mb-4" />
            <h3 className="text-xl font-medium">Upload Successful!</h3>
            <p className="text-sm mt-2 text-gray-600">Your document has been uploaded successfully.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <ImageUpload
              onFileSelect={handleFileSelect}
              maxSize={10}
              accept="image/*,application/pdf"
              label="Drag and drop your file here or click to browse"
              isUploading={isUploading}
              error={uploadError || undefined}
            />
            
            <div className="space-y-3 mt-4">
              {pendingRequests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Associate with Request (Optional)
                  </label>
                  <Select value={documentRequestId} onValueChange={handleRequestChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pending request (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {pendingRequests.map((req) => (
                        <SelectItem key={req.id} value={req.id}>{req.docType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TEMPLATES.map((template) => (
                      <SelectItem key={template} value={template}>{template}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <Select value={visibility} onValueChange={(v: 'private' | 'shared') => setVisibility(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private (Negotiator & You Only)</SelectItem>
                    <SelectItem value="shared">Shared (All Transaction Parties)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !docType || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Max file size: 10MB. Supported formats: Images, PDF
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadWidget;
