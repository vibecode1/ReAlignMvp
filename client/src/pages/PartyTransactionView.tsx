import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import PhaseTracker from "@/components/transactions/PhaseTracker";
import MessageThread from "@/components/transactions/MessageThread";
import DocRequestList from "@/components/transactions/DocRequestList";
import UploadWidget from "@/components/transactions/UploadWidget";
import { motion } from "framer-motion";
import { TransactionDetail, DocumentRequestInfo } from "shared/types";

interface PartyTransactionViewProps {
  id: string;
}

export default function PartyTransactionView({ id }: PartyTransactionViewProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);
  
  // Fetch transaction details
  const { 
    data: transaction, 
    isLoading, 
    error,
    isError
  } = useQuery<TransactionDetail>({
    queryKey: [`/api/v1/transactions/${id}`],
  });
  
  // Get transaction details object for easier access
  const transactionDetails = transaction || {
    id: '',
    title: '',
    property_address: '',
    currentPhase: '',
    created_by: { id: '', name: '' },
    created_at: '',
    parties: [],
    messages: [],
    documentRequests: [],
    uploads: []
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }
  
  // Error state
  if (isError || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8 mr-2" />
          <span className="text-xl font-medium">Error loading transaction</span>
        </div>
        <p className="text-gray-600 mb-6">
          The transaction could not be loaded. It may not exist or you don't have access.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  // Filter document requests assigned to current user
  const userDocumentRequests = transactionDetails.documentRequests.filter(
    req => req.assignedTo === user?.id
  );
  
  // Render the party transaction view
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{transactionDetails.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{transactionDetails.property_address}</p>
      </div>
      
      {/* Phase Tracker (collapsed by default) */}
      <div className="mb-8">
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => setShowPhaseDetails(!showPhaseDetails)}>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  You're currently in Phase: {transactionDetails.currentPhase}
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                {showPhaseDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {showPhaseDetails && (
            <CardContent>
              <PhaseTracker 
                currentPhase={transactionDetails.currentPhase} 
                showTimeline={true}
                isEditable={false}
              />
            </CardContent>
          )}
        </Card>
      </div>
      
      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width on larger screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* What's Still Needed Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What's Still Needed</CardTitle>
                <CardDescription>
                  Documents requested for this transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDocumentRequests.length > 0 ? (
                  <DocRequestList
                    requests={userDocumentRequests}
                    currentUserRole={user?.role || ''}
                    onUpdateRequestStatus={async (id, newStatus) => {
                      try {
                        await apiRequest('PATCH', `/api/v1/doc-requests/${id}`, {
                          status: newStatus
                        });
                        
                        toast({
                          title: "Status Updated",
                          description: `Document request status has been updated to ${newStatus}.`
                        });
                        queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                      } catch (error) {
                        console.error('Failed to update request status:', error);
                        toast({
                          title: "Update Failed",
                          description: "There was an error updating the request status.",
                          variant: "destructive",
                        });
                      }
                    }}
                    onRemind={() => {}} // Party can't remind
                    onResetToPending={() => {}} // Party can't reset
                    onUploadForRequest={(requestId) => {
                      // Find the document request
                      const docRequest = transactionDetails.documentRequests.find(
                        req => req.id === requestId
                      );
                      
                      if (docRequest) {
                        toast({
                          title: "Upload Initiated",
                          description: `Please upload your ${docRequest.docType} document using the upload panel below.`,
                        });
                        
                        // Scroll to upload section
                        document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No documents requested from you at this time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Messages Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Communication thread for this transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MessageThread
                  messages={transactionDetails.messages}
                  currentUserRole={user?.role || ''}
                  currentUserId={user?.id || ''}
                  onSendMessage={async (text, replyTo) => {
                    try {
                      await apiRequest('POST', `/api/v1/transactions/${id}/messages`, {
                        text,
                        replyTo: replyTo || null,
                      });
                      
                      toast({
                        title: "Message Sent",
                        description: "Your message has been sent successfully."
                      });
                      
                      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                    } catch (error) {
                      console.error('Failed to send message:', error);
                      toast({
                        title: "Send Failed",
                        description: "There was an error sending your message. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  isNegotiator={false} // Party can't start new threads
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Right column - Upload Section */}
        <div className="space-y-6">
          <motion.div
            id="upload-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Submit documents for this transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadWidget
                  transactionId={id}
                  defaultVisibility="private"
                  role={user?.role}
                  documentRequests={transactionDetails.documentRequests.filter(
                    req => req.assignedTo === user?.id && req.status === 'pending'
                  )}
                  onUploadComplete={async (uploadDetails) => {
                    toast({
                      title: "Upload Complete",
                      description: `${uploadDetails.name} has been uploaded successfully.`
                    });
                    queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                  }}
                />
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Uploads are private to you and the negotiator by default.
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Previous Uploads Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionDetails.uploads && transactionDetails.uploads.length > 0 ? (
                  <div className="space-y-3">
                    {transactionDetails.uploads
                      .filter(upload => upload.uploadedBy === user?.id)
                      .map((upload) => (
                        <div 
                          key={upload.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                        >
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-3 text-gray-500" />
                            <div>
                              <p className="font-medium text-sm">{upload.fileName}</p>
                              <p className="text-xs text-gray-500">{upload.docType} • {upload.visibility === 'private' ? 'Private' : 'Shared'}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(upload.fileUrl, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>You haven't uploaded any documents yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}