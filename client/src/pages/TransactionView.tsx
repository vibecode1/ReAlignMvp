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
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Pencil, 
  Save, 
  X 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import PhaseTracker from "@/components/transactions/PhaseTracker";
import PartyCard, { PartyRole, PartyStatus } from "@/components/transactions/PartyCard";
import MessageThread, { Message } from "@/components/transactions/MessageThread";
import DocRequestList, { DocumentRequest } from "@/components/transactions/DocRequestList";
import UploadWidget from "@/components/transactions/UploadWidget";
import FileList from "@/components/transactions/FileList";
import { motion } from "framer-motion";

// Define transaction interface to help with TypeScript errors
interface TransactionDetail {
  id: string;
  title: string;
  property_address: string;
  currentPhase: string;
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  parties: Array<{
    userId: string;
    name: string;
    role: PartyRole;
    status: PartyStatus;
    lastAction?: string;
  }>;
  messages: Message[];
  documentRequests: DocumentRequest[];
  uploads: Array<{
    id: string;
    docType: string;
    fileName: string;
    fileUrl: string;
    contentType: string;
    sizeBytes: number;
    uploadedBy: string;
    visibility: 'private' | 'shared';
    uploadedAt: string;
  }>;
}

interface TransactionViewProps {
  id: string;
}

export default function TransactionView({ id }: TransactionViewProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Editable fields
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch transaction details
  const { 
    data: transaction, 
    isLoading, 
    error,
    isError
  } = useQuery<TransactionDetail>({
    queryKey: [`/api/v1/transactions/${id}`],
    // For development, provide a fallback mock transaction if no data is retrieved
    select: (data) => {
      if (!data) {
        // This is only for development purposes when the API is not fully implemented
        return {
          id,
          title: 'Sample Transaction',
          property_address: '123 Main St, Anytown, CA 90210',
          currentPhase: 'documents',
          created_by: {
            id: 'user-1',
            name: 'John Smith'
          },
          created_at: new Date().toISOString(),
          parties: [],
          messages: [],
          documentRequests: [],
          uploads: []
        } as TransactionDetail;
      }
      return data;
    }
  });
  
  // Get transaction details object for easier access with default empty object fallback
  const transactionDetails = transaction || {} as TransactionDetail;

  // Reset edited fields when transaction data changes
  useEffect(() => {
    if (transaction) {
      setEditedTitle(transaction.title || '');
      setEditedAddress(transaction.property_address || '');
    }
  }, [transaction]);
  
  // Handle updating transaction details
  const handleUpdateField = async (field: 'title' | 'property_address', value: string) => {
    try {
      setIsUpdating(true);
      
      const updateData: any = {};
      updateData[field] = value;
      
      await apiRequest('PATCH', `/api/v1/transactions/${id}`, updateData);
      
      // Reset edit mode
      setIsEditingTitle(false);
      setIsEditingAddress(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
      
      toast({
        title: "Update Successful",
        description: `Transaction ${field === 'title' ? 'title' : 'address'} has been updated.`,
      });
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      toast({
        title: "Update Failed",
        description: `Failed to update transaction ${field}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePhaseUpdate = (newPhase: string) => {
    // The API call is handled in the PhaseTracker component
    // This is just to update the local state if needed
    queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
  };
  
  // Check if user is a negotiator
  const isNegotiator = user?.role === 'negotiator';
  
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
        <Button onClick={() => navigate('/transactions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Button>
      </div>
    );
  }
  
  // Render the transaction view

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-4"
          onClick={() => navigate('/transactions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editedTitle} 
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-bold"
                  disabled={isUpdating}
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => handleUpdateField('title', editedTitle)}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => {
                    setEditedTitle(transactionDetails.title || '');
                    setIsEditingTitle(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-brand-primary">
                {transactionDetails.title || 'Transaction Title'}
                {isNegotiator && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </h1>
            )}
          </div>
          
          <div className="flex items-center mt-1">
            {isEditingAddress ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={editedAddress} 
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="text-gray-600"
                  disabled={isUpdating}
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => handleUpdateField('property_address', editedAddress)}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => {
                    setEditedAddress(transactionDetails.property_address || '');
                    setIsEditingAddress(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-600">
                {transactionDetails.property_address || 'Property Address'}
                {isNegotiator && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-1"
                    onClick={() => setIsEditingAddress(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Transaction details content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="md:col-span-2 space-y-6">
          <PhaseTracker 
            currentPhase={transactionDetails.currentPhase || 'intro'}
            showTimeline={true}
            creationDate={new Date(transactionDetails.created_at || Date.now())}
            isEditable={isNegotiator}
            onPhaseChange={async (newPhase) => {
              try {
                await apiRequest('PATCH', `/api/v1/transactions/${id}`, {
                  currentPhase: newPhase
                });
                
                toast({
                  title: "Phase Updated",
                  description: "Transaction phase has been successfully updated.",
                });
                
                queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
              } catch (error) {
                console.error('Failed to update phase:', error);
                toast({
                  title: "Update Failed",
                  description: "There was an error updating the transaction phase. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <MessageThread 
              messages={transactionDetails.messages || []}
              currentUserRole={user?.role || 'unknown'}
              onSendMessage={async (text, replyToId) => {
                try {
                  const messageData = {
                    text,
                    reply_to: replyToId || null
                  };
                  
                  await apiRequest('POST', `/api/v1/transactions/${id}/messages`, messageData);
                  
                  toast({
                    title: "Message Sent",
                    description: "Your message has been sent successfully.",
                  });
                  
                  // Refresh data
                  queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                } catch (error) {
                  console.error('Failed to send message:', error);
                  toast({
                    title: "Message Failed",
                    description: "There was an error sending your message. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onUpload={(file) => {
                // Redirect to the upload panel with focus
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                  toast({
                    title: "File Selected",
                    description: "Please complete your upload using the upload panel.",
                  });
                }
              }}
              initialMessageEditable={isNegotiator && 
                transactionDetails.messages?.some((m) => m.isSeedMessage === true)}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DocRequestList 
              requests={transactionDetails.documentRequests || []}
              currentUserRole={user?.role || 'unknown'}
              parties={transactionDetails.parties}
              onCreateRequest={async (docType, assignedTo, dueDate) => {
                try {
                  await apiRequest('POST', `/api/v1/transactions/${id}/doc-requests`, {
                    docType,
                    assignedToUserId: assignedTo,
                    dueDate: dueDate || undefined
                  });
                  
                  toast({
                    title: "Request Created",
                    description: "Document request has been created successfully.",
                  });
                  queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                } catch (error) {
                  console.error('Failed to create document request:', error);
                  toast({
                    title: "Creation Failed",
                    description: "There was an error creating the document request. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onUpdateRequestStatus={async (requestId, newStatus) => {
                try {
                  await apiRequest('PATCH', `/api/v1/doc-requests/${requestId}`, {
                    status: newStatus
                  });
                  
                  toast({
                    title: "Document Status Updated",
                    description: `Document request status has been updated to ${newStatus}.`,
                  });
                  queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                } catch (error) {
                  console.error('Failed to update document status:', error);
                  toast({
                    title: "Update Failed",
                    description: "There was an error updating the document status. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onRemind={async (requestId) => {
                try {
                  // Call notification service to send a reminder
                  await apiRequest('POST', `/api/v1/doc-requests/${requestId}/remind`, {});
                  
                  toast({
                    title: "Reminder Sent",
                    description: "A reminder has been sent to the assigned party.",
                  });
                } catch (error) {
                  console.error('Failed to send reminder:', error);
                  toast({
                    title: "Reminder Failed",
                    description: "There was an error sending the reminder. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onResetToPending={async (requestId, note) => {
                try {
                  await apiRequest('PATCH', `/api/v1/doc-requests/${requestId}`, {
                    status: 'pending',
                    revision_note: note
                  });
                  
                  toast({
                    title: "Revision Requested",
                    description: "The document has been reset to pending with your revision notes.",
                  });
                  queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                } catch (error) {
                  console.error('Failed to request revision:', error);
                  toast({
                    title: "Update Failed",
                    description: "There was an error requesting the revision. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onUploadForRequest={(requestId) => {
                // Find the document type from the request
                const docRequest = transactionDetails.documentRequests?.find(req => req.id === requestId);
                
                // Scroll to the upload section
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) {
                  uploadSection.scrollIntoView({ behavior: 'smooth' });
                  
                  // Set the document type in the upload widget if available
                  if (docRequest) {
                    // Note: In a full implementation, we would also pass the document request ID
                    // to the upload widget to link the upload to this specific request
                    toast({
                      title: "Upload Initiated",
                      description: `Please upload your ${docRequest.docType} document using the upload panel below.`,
                    });
                  } else {
                    toast({
                      title: "Upload Initiated",
                      description: "Please use the upload panel to submit your document.",
                    });
                  }
                }
              }}
            />
          </motion.div>
        </div>
        
        {/* Right column - sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Transaction Parties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactionDetails.parties && transactionDetails.parties.map((party) => (
                  <PartyCard
                    key={party.userId}
                    role={party.role}
                    name={party.name}
                    status={party.status}
                    lastAction={party.lastAction}
                    isEditable={isNegotiator}
                    onStatusChange={async (newStatus) => {
                      try {
                        await apiRequest('PATCH', `/api/v1/transactions/${id}/parties/${party.userId}`, {
                          status: newStatus,
                          lastAction: `Status updated to ${newStatus} on ${new Date().toLocaleDateString()}`
                        });
                        
                        toast({
                          title: "Status Updated",
                          description: `${party.name}'s status has been updated to ${newStatus}.`
                        });
                        queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                      } catch (error) {
                        console.error('Failed to update party status:', error);
                        toast({
                          title: "Update Failed",
                          description: "There was an error updating the party status. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                ))}
                {(!transactionDetails.parties || transactionDetails.parties.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No parties assigned to this transaction yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            id="upload-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <UploadWidget 
              transactionId={id}
              onUploadComplete={async (uploadDetails) => {
                // Show immediate toast for the upload
                toast({
                  title: "Upload Successful",
                  description: `Your ${uploadDetails.name} has been uploaded successfully.`,
                });
                
                // If this upload was for a document request, mark the request as complete
                if (uploadDetails.documentRequestId) {
                  try {
                    await apiRequest('PATCH', `/api/v1/doc-requests/${uploadDetails.documentRequestId}`, {
                      status: 'complete'
                    });
                    
                    toast({
                      title: "Document Request Completed",
                      description: "The document request has been marked as complete.",
                    });
                  } catch (error) {
                    console.error('Failed to update document request status:', error);
                    // Don't show error toast here since the upload was successful
                  }
                }
                
                // Refresh the transaction data
                queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
              }}
              defaultVisibility="private"
              role={user?.role}
              maxFileSizeMB={10}
              documentRequests={transactionDetails.documentRequests?.filter(
                req => req.assignedTo === user?.role && req.status !== 'complete'
              )}
            />
          </motion.div>
          
          {/* Transaction Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created by</p>
                    <p>{transactionDetails.created_by?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created on</p>
                    <p>{new Date(transactionDetails.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Phase</p>
                    <p className="capitalize">{transactionDetails.currentPhase || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
