import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus2, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// Document request templates
const REQUEST_TEMPLATES = [
  "Paystubs (30 Days)",
  "Bank Statements (2 Months)",
  "4506-C Form",
  "Short Sale Affidavit",
  "Last 2 Years of Tax Returns",
  "Hardship Letter",
  "Property Insurance",
  "Mortgage Statement"
];

interface DocumentRequestInfo {
  id: string;
  docType: string;
  assignedTo: string;
  assignedToUserId: string;
  status: 'pending' | 'complete' | 'overdue';
  dueDate?: string;
  revisionNote?: string;
}

interface PartyInfo {
  userId: string;
  name: string;
  role: string;
}

interface DocRequestListProps {
  transactionId: string;
  requests: DocumentRequestInfo[];
  parties: PartyInfo[];
  currentUserRole: string;
  isLoading?: boolean;
}

export const DocRequestList = ({ 
  transactionId, 
  requests,
  parties,
  currentUserRole,
  isLoading = false
}: DocRequestListProps) => {
  const [selectedRequestForNote, setSelectedRequestForNote] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedParty, setSelectedParty] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isNegotiator = currentUserRole === 'negotiator';

  const handleMakeRequest = async () => {
    if (!selectedTemplate || !selectedParty) return;
    
    try {
      setIsCreatingRequest(true);
      
      await apiRequest('POST', `/api/v1/transactions/${transactionId}/doc-requests`, {
        docType: selectedTemplate,
        assignedToUserId: selectedParty,
        dueDate: dueDate || undefined
      });
      
      // Reset form
      setSelectedTemplate("");
      setSelectedParty("");
      setDueDate("");
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/doc-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      
      toast({
        title: "Document Requested",
        description: "Document request has been sent successfully.",
      });
    } catch (error) {
      console.error('Failed to create document request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to create document request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const handleResetToPending = async (requestId: string) => {
    if (!revisionNote.trim()) return;
    
    try {
      setIsUpdatingRequest(true);
      
      await apiRequest('PATCH', `/api/v1/doc-requests/${requestId}`, {
        status: 'pending',
        revisionNote: revisionNote
      });
      
      // Reset form
      setSelectedRequestForNote(null);
      setRevisionNote("");
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/doc-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      
      toast({
        title: "Request Updated",
        description: "Document request has been reset to pending with revision note.",
      });
    } catch (error) {
      console.error('Failed to update document request:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update document request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const handleMarkComplete = async (requestId: string) => {
    try {
      setIsUpdatingRequest(true);
      
      await apiRequest('PATCH', `/api/v1/doc-requests/${requestId}`, {
        status: 'complete'
      });
      
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/doc-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      
      toast({
        title: "Request Completed",
        description: "Document request has been marked as complete.",
      });
    } catch (error) {
      console.error('Failed to update document request:', error);
      toast({
        title: "Update Failed",
        description: "Failed to mark request as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  // Status indicator component
  const StatusIndicator = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Complete
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FilePlus2 className="mr-2 h-5 w-5" />
          Document Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FilePlus2 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No document requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{req.docType}</h3>
                          <div className="ml-3">
                            <StatusIndicator status={req.status} />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Assigned to: {req.assignedTo}
                        </p>
                        {req.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {new Date(req.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {isNegotiator && req.status !== 'complete' && (
                        <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isUpdatingRequest}
                            onClick={() => handleMarkComplete(req.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Mark Complete
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isUpdatingRequest || selectedRequestForNote === req.id}
                            onClick={() => setSelectedRequestForNote(req.id)}
                          >
                            Reset to Pending w/ Note
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {req.revisionNote && req.status === 'pending' && (
                      <div className="mt-3 p-2 bg-amber-50 text-amber-800 rounded-md text-sm">
                        <p className="font-medium">Revision Note:</p>
                        <p>{req.revisionNote}</p>
                      </div>
                    )}
                    
                    {selectedRequestForNote === req.id && (
                      <div className="mt-3">
                        <Textarea 
                          placeholder="Reason for revision..." 
                          value={revisionNote} 
                          onChange={(e) => setRevisionNote(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            disabled={!revisionNote.trim() || isUpdatingRequest}
                            onClick={() => handleResetToPending(req.id)}
                          >
                            {isUpdatingRequest ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Note & Reset'
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequestForNote(null);
                              setRevisionNote("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Request form for negotiators */}
            {isNegotiator && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-medium mb-3">Request a New Document</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
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
                      Assign To
                    </label>
                    <Select value={selectedParty} onValueChange={setSelectedParty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select party" />
                      </SelectTrigger>
                      <SelectContent>
                        {parties.map((party) => (
                          <SelectItem key={party.userId} value={party.userId}>
                            {party.name} ({party.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    disabled={!selectedTemplate || !selectedParty || isCreatingRequest}
                    onClick={handleMakeRequest}
                  >
                    {isCreatingRequest ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Request...
                      </>
                    ) : (
                      <>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        Create Document Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocRequestList;
