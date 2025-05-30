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
  X,
  ExternalLink,
  Copy,
  CheckCircle2,
  FileText,
  Wrench
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
import TrackerNotesWidget from "@/components/transactions/TrackerNotesWidget";
import PhaseManager from "@/components/transactions/PhaseManager";
import { AddPartyForm } from "@/components/AddPartyForm";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import DocumentChecklistGenerator from "@/components/transactions/DocumentChecklistGenerator";

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
    welcome_email_sent?: boolean;
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
  const [showDocumentChecklist, setShowDocumentChecklist] = useState(false);

  // Fetch transaction details
  const { 
    data: transaction, 
    isLoading, 
    error,
    isError
  } = useQuery<TransactionDetail>({
    queryKey: [`/api/v1/transactions/${id}`],
    enabled: !!id
  });

  // Reset edited fields when transaction data changes
  useEffect(() => {
    if (transaction) {
      setEditedTitle(transaction.title || '');
      setEditedAddress(transaction.property_address || '');
    }
  }, [transaction]);

  // Debug logging for frontend data
  useEffect(() => {
    if (transaction) {
      console.log('=== FRONTEND: RECEIVED TRANSACTION DATA ===');
      console.log('Full transactionDetails object:', transaction);
      console.log('transactionDetails.parties:', transaction?.parties);
      console.log('=== END FRONTEND DEBUG ===');
    }
  }, [transaction]);

  // Provide safe access to transaction data
  const transactionDetails = transaction || {} as TransactionDetail;

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
      {/* Header with back button - mobile optimized */}
      <div className="mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="btn-mobile focus-enhanced flex-shrink-0 mt-1"
          onClick={() => navigate('/transactions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full">
                <Input 
                  value={editedTitle} 
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-lg sm:text-xl font-bold flex-1"
                  disabled={isUpdating}
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={() => handleUpdateField('title', editedTitle)}
                  className="btn-mobile focus-enhanced"
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
                  className="btn-mobile focus-enhanced"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 w-full">
                <h1 className="text-lg sm:text-2xl font-bold text-brand-primary leading-tight flex-1 min-w-0 break-words">
                  {transactionDetails.title || 'Transaction Title'}
                </h1>
                {isNegotiator && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="btn-mobile focus-enhanced flex-shrink-0"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center mt-1 flex-wrap gap-2">
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
              <>
                <p className="text-gray-600 flex items-center">
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
                {/* Transaction View Link and Copy Link Button */}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/v1/transactions/${id}/tracker-link`);
                        if (response.ok) {
                          const data = await response.json();
                          const trackerUrl = `${window.location.origin}/tracker/${id}?token=${data.token}`;
                          window.open(trackerUrl, '_blank');
                        } else {
                          toast({
                            title: "Error",
                            description: "Could not get tracker link.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Could not get tracker link.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Transaction View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/v1/transactions/${id}/tracker-link`);
                        if (response.ok) {
                          const data = await response.json();
                          const trackerUrl = `${window.location.origin}/tracker/${id}?token=${data.token}`;
                          await navigator.clipboard.writeText(trackerUrl);
                          toast({
                            title: "Link Copied",
                            description: "Transaction view link copied to clipboard.",
                          });
                        } else {
                          toast({
                            title: "Error",
                            description: "Could not get tracker link.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Copy Failed",
                          description: "Could not copy link to clipboard.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transaction details content - mobile-first stacking */}
      <div className="space-y-4 lg:space-y-6">
        {/* Phase Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>

        {/* Quick Actions Section - Only for negotiators */}
        {isNegotiator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Access tools and features for this transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => navigate(`/loe-drafter/${id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">LOE Drafter</div>
                        <div className="text-sm text-muted-foreground">
                          Create hardship letters
                        </div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => navigate(`/uba-form-maker?transactionId=${id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">UBA Form</div>
                        <div className="text-sm text-muted-foreground">
                          AI-powered form completion
                        </div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => setShowDocumentChecklist(true)}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 mt-0.5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Document Checklist</div>
                        <div className="text-sm text-muted-foreground">
                          Dynamic document requirements
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Party Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transaction Parties</CardTitle>
                  <CardDescription>
                    Manage the parties involved in this transaction
                  </CardDescription>
                </div>
                {isNegotiator && (
                  <AddPartyForm transactionId={id} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {transactionDetails.parties?.map((party, index) => (
                  <div key={party.userId || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{party.name}</h4>
                        {party.welcome_email_sent && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
                      </div>
                      <Badge variant={
                        party.status === 'complete' ? 'default' :
                        party.status === 'overdue' ? 'destructive' : 'secondary'
                      }>
                        {party.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Role: {party.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {party.lastAction && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Last action: {party.lastAction}
                      </p>
                    )}
                  </div>
                ))}
                {(!transactionDetails.parties || transactionDetails.parties.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    No parties added yet
                    {isNegotiator && <span className="block text-sm mt-1">Click "Add Party" to get started</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
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

        {/* Document Checklist Generator */}
        {showDocumentChecklist && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <DocumentChecklistGenerator 
              transactionId={id}
              onDocumentUpload={(documentId) => {
                // Refresh transaction data when a document is uploaded
                queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                toast({
                  title: "Document Uploaded",
                  description: "The document has been uploaded to the checklist.",
                });
              }}
            />
          </motion.div>
        )}

        {/* Message Thread - Mobile Optimized */}
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

        {/* Upload and File Management - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          id="upload-section"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Upload Widget */}
            <div>
              <UploadWidget
                transactionId={id!}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${id}`] });
                  toast({
                    title: "Upload Complete",
                    description: "Your file has been uploaded successfully.",
                  });
                }}
              />
            </div>

            {/* File List */}
            <div>
              <FileList 
                uploads={transactionDetails.uploads || []}
                transactionId={id!}
                currentUserRole={user?.role || 'unknown'}
                currentUserId={user?.id || ''}
              />
            </div>
          </div>
        </motion.div>

        {/* Phase Manager for Negotiators - Mobile Optimized */}
        {isNegotiator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <PhaseManager 
              transactionId={id!}
              currentPhase={transactionDetails.currentPhase || 'intro'}
              userRole={user?.role || 'unknown'}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}