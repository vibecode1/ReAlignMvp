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
import PartyCard from "@/components/transactions/PartyCard";
import MessageThread from "@/components/transactions/MessageThread";
import DocRequestList from "@/components/transactions/DocRequestList";
import UploadWidget from "@/components/transactions/UploadWidget";
import { motion } from "framer-motion";

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
  } = useQuery({
    queryKey: [`/api/v1/transactions/${id}`],
  });
  
  // Reset edited fields when transaction data changes
  useEffect(() => {
    if (transaction) {
      setEditedTitle(transaction.title);
      setEditedAddress(transaction.property_address);
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
                    setEditedTitle(transaction.title);
                    setIsEditingTitle(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-brand-primary">
                {transaction.title}
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
                    setEditedAddress(transaction.property_address);
                    setIsEditingAddress(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-600">
                {transaction.property_address}
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
            transactionId={id}
            currentPhase={transaction.currentPhase}
            creationDate={new Date(transaction.created_at)}
            isNegotiator={isNegotiator}
            onPhaseChange={handlePhaseUpdate}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <MessageThread 
              transactionId={id}
              messages={transaction.messages}
              currentUserRole={user?.role || 'unknown'}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DocRequestList 
              transactionId={id}
              requests={transaction.documentRequests}
              parties={transaction.parties}
              currentUserRole={user?.role || 'unknown'}
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
            <PartyCard parties={transaction.parties} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <UploadWidget 
              transactionId={id}
              documentRequests={transaction.documentRequests}
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
                    <p>{transaction.created_by.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created on</p>
                    <p>{new Date(transaction.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Phase</p>
                    <p>{transaction.currentPhase}</p>
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
