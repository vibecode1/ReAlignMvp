import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Transaction phases based on API documentation
const PHASES = [
  "Transaction Initiated",
  "Property Listed",
  "Initial Document Collection",
  "Offer Received",
  "Offer Submitted",
  "Lender Review",
  "BPO Ordered",
  "Approval Received",
  "In Closing"
];

// Phase descriptions for tooltips
const PHASE_DESCRIPTIONS: Record<string, string> = {
  "Transaction Initiated": "The transaction has been created and parties have been invited",
  "Property Listed": "The property has been listed for sale",
  "Initial Document Collection": "Collecting initial documents from the seller",
  "Offer Received": "An offer has been received on the property",
  "Offer Submitted": "The offer has been submitted to the lender for review",
  "Lender Review": "The lender is reviewing the offer",
  "BPO Ordered": "Broker Price Opinion has been ordered to assess property value",
  "Approval Received": "The lender has approved the short sale",
  "In Closing": "The transaction is in the closing process"
};

interface PhaseTrackerProps {
  transactionId: string;
  currentPhase: string;
  creationDate?: Date;
  isNegotiator: boolean;
  onPhaseChange?: (phase: string) => void;
}

export const PhaseTracker = ({ 
  transactionId, 
  currentPhase, 
  creationDate, 
  isNegotiator,
  onPhaseChange
}: PhaseTrackerProps) => {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handlePhaseUpdate = async () => {
    if (selectedPhase === currentPhase) return;
    
    try {
      setIsUpdating(true);
      
      await apiRequest('PATCH', `/api/v1/transactions/${transactionId}`, {
        currentPhase: selectedPhase
      });
      
      toast({
        title: "Phase Updated",
        description: `Transaction phase updated to ${selectedPhase}`,
      });
      
      if (onPhaseChange) {
        onPhaseChange(selectedPhase);
      }
    } catch (error) {
      console.error('Failed to update phase:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update transaction phase. Please try again.",
        variant: "destructive",
      });
      // Reset to current phase on error
      setSelectedPhase(currentPhase);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get the index of the current phase to show progress
  const currentPhaseIndex = PHASES.indexOf(currentPhase);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Transaction Progress</span>
          {creationDate && (
            <span className="text-sm font-normal text-muted-foreground">
              Started: {new Date(creationDate).toLocaleDateString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
          <motion.div 
            className="h-2 bg-brand-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentPhaseIndex + 1) / PHASES.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {isNegotiator ? (
            <>
              <div className="flex-grow">
                <Select
                  value={selectedPhase}
                  onValueChange={setSelectedPhase}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handlePhaseUpdate} 
                disabled={selectedPhase === currentPhase || isUpdating}
                className="whitespace-nowrap"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Phase'
                )}
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-medium">
                    Current Phase: {currentPhase}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{PHASE_DESCRIPTIONS[currentPhase] || "No description available"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhaseTracker;
