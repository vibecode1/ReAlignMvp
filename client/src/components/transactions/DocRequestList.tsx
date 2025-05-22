import React, { useState } from 'react';
import { 
  Clock, 
  Check, 
  AlertTriangle, 
  Send, 
  RefreshCcw,
  FileText,
  Upload 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DocumentRequest {
  id: string;
  docType: string;
  assignedTo: string;
  status: 'pending' | 'complete' | 'overdue';
  dueDate?: string;
  revisionNote?: string;
}

interface DocRequestListProps {
  requests: DocumentRequest[];
  currentUserRole: string;
  parties?: Array<{userId: string, name: string, role: string}>;
  onUpdateRequestStatus: (id: string, newStatus: string) => void;
  onRemind: (id: string) => void;
  onResetToPending: (id: string, note: string) => void;
  onUploadForRequest: (requestId: string) => void;
  onCreateRequest?: (docType: string, assignedTo: string, dueDate?: string) => void;
}

// Document type templates for UI display
export const REQUEST_TEMPLATES = [
  { value: 'purchase_agreement', label: 'Purchase Agreement' },
  { value: 'mortgage_statement', label: 'Mortgage Statement' },
  { value: 'tax_returns', label: 'Tax Returns' },
  { value: 'hoa_documents', label: 'HOA Documents' },
  { value: 'bank_statements', label: 'Bank Statements' },
  { value: 'hardship_letter', label: 'Hardship Letter' },
  { value: 'income_verification', label: 'Income Verification' },
  { value: 'photo_id', label: 'Photo ID' },
  { value: 'property_photos', label: 'Property Photos' },
  { value: 'insurance_docs', label: 'Insurance Documents' },
  { value: 'other', label: 'Other Document' }
];

export const DocRequestList: React.FC<DocRequestListProps> = ({
  requests,
  currentUserRole,
  parties = [],
  onUpdateRequestStatus,
  onRemind,
  onResetToPending,
  onUploadForRequest,
  onCreateRequest
}) => {
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDocType, setNewDocType] = useState(REQUEST_TEMPLATES[0].value);
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Format document type label
  const getDocTypeLabel = (docType: string): string => {
    const template = REQUEST_TEMPLATES.find(tpl => tpl.value === docType);
    return template ? template.label : docType;
  };
  
  // Handle status update
  const handleStatusChange = (requestId: string, newStatus: string) => {
    onUpdateRequestStatus(requestId, newStatus);
  };
  
  // Handle send reminder
  const handleRemind = (requestId: string) => {
    onRemind(requestId);
  };
  
  // Open revision dialog
  const openRevisionDialog = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setRevisionNote(request.revisionNote || '');
    setDialogOpen(true);
  };
  
  // Submit revision note
  const submitRevisionNote = () => {
    if (selectedRequest && revisionNote.trim()) {
      onResetToPending(selectedRequest.id, revisionNote);
      setDialogOpen(false);
      setSelectedRequest(null);
      setRevisionNote('');
    }
  };
  
  // Check if user can edit requests
  const isNegotiator = currentUserRole === 'negotiator';
  
  // Group requests by status for visual organization
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const overdueRequests = requests.filter(req => req.status === 'overdue');
  const completedRequests = requests.filter(req => req.status === 'complete');
  
  // Render status icon
  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'complete':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Render a single document request
  const renderRequest = (request: DocumentRequest) => {
    const isUserAssigned = request.assignedTo === currentUserRole;
    const hasRevisionNote = !!request.revisionNote;
    
    return (
      <div 
        key={request.id} 
        className={cn(
          "border p-4 rounded-lg shadow-sm mb-3",
          request.status === 'pending' ? "bg-white border-yellow-100 dark:bg-gray-800 dark:border-yellow-900" : "",
          request.status === 'complete' ? "bg-white border-green-100 dark:bg-gray-800 dark:border-green-900" : "",
          request.status === 'overdue' ? "bg-white border-red-100 dark:bg-gray-800 dark:border-red-900" : ""
        )}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            <div className="mt-1">{renderStatusIcon(request.status)}</div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {getDocTypeLabel(request.docType)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to: {request.assignedTo}
              </p>
              
              {request.dueDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Due: {format(new Date(request.dueDate), 'MMM d, yyyy')}
                </p>
              )}
              
              {hasRevisionNote && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-400 text-xs mb-1">
                    Revision Requested:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{request.revisionNote}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            {/* Controls for negotiator */}
            {isNegotiator && (
              <div className="flex gap-2">
                {request.status !== 'complete' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(request.id, 'complete')}
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                )}
                
                {request.status === 'complete' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={openRevisionDialog.bind(null, request)}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Request Revision
                  </Button>
                )}
                
                {(request.status === 'pending' || request.status === 'overdue') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemind(request.id)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Reminder
                  </Button>
                )}
              </div>
            )}
            
            {/* Controls for assigned parties */}
            {isUserAssigned && request.status !== 'complete' && (
              <Button 
                onClick={() => onUploadForRequest(request.id)}
                size="sm"
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Document
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Handle creation of new document request
  const handleCreateRequest = () => {
    if (onCreateRequest && assignedToUserId && newDocType) {
      onCreateRequest(newDocType, assignedToUserId, dueDate);
      
      // Reset the form
      setNewDocType(REQUEST_TEMPLATES[0].value);
      setAssignedToUserId('');
      setDueDate('');
      setCreateDialogOpen(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Document Requests
          </CardTitle>
          
          {/* Only show "New Request" button for negotiators */}
          {isNegotiator && onCreateRequest && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No document requests yet.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue requests */}
            {overdueRequests.length > 0 && (
              <div>
                <h3 className="text-red-600 dark:text-red-400 font-medium mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Overdue
                </h3>
                <div>{overdueRequests.map(renderRequest)}</div>
              </div>
            )}
            
            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-yellow-600 dark:text-yellow-400 font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Pending
                </h3>
                <div>{pendingRequests.map(renderRequest)}</div>
              </div>
            )}
            
            {/* Completed requests */}
            {completedRequests.length > 0 && (
              <div>
                <h3 className="text-green-600 dark:text-green-400 font-medium mb-3 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </h3>
                <div>{completedRequests.map(renderRequest)}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Revision Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Document Revision</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Please provide details about what needs to be corrected or added to the document:
            </p>
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Enter revision details..."
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRevisionNote}
              disabled={!revisionNote.trim()}
            >
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Request Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Document Request</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type</Label>
              <Select value={newDocType} onValueChange={setNewDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TEMPLATES.map(template => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select 
                value={assignedToUserId} 
                onValueChange={setAssignedToUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map(party => (
                    <SelectItem key={party.userId} value={party.userId}>
                      {party.name} ({party.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(new Date(dueDate), 'PPP') : <span>Select a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => setDueDate(date ? date.toISOString() : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRequest}
              disabled={!newDocType || !assignedToUserId}
            >
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DocRequestList;