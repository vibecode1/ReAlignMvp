import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TRANSACTION_PHASES, getPhaseIndex } from "@/lib/phases";
import { motion } from "framer-motion";

interface PhaseHistoryEntry {
  phase_key: string;
  timestamp: string;
}

interface PhaseManagerProps {
  transactionId: string;
  currentPhase: string;
  userRole: string;
}

export default function PhaseManager({ transactionId, currentPhase, userRole }: PhaseManagerProps) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch phase history
  const { data: phaseHistory = [] } = useQuery<PhaseHistoryEntry[]>({
    queryKey: [`/api/v1/transactions/${transactionId}/phase-history`],
    enabled: !!transactionId
  });

  // Update phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: (phaseData: { phase: string }) => 
      apiRequest(`/api/v1/transactions/${transactionId}/phase`, 'PUT', phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/v1/transactions/${transactionId}/phase-history`] });
      setIsUpdating(false);
      toast({
        title: "Phase Updated",
        description: "Transaction phase has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction phase. Please try again.",
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  });

  const handleUpdatePhase = () => {
    if (selectedPhase === currentPhase) return;
    
    setIsUpdating(true);
    updatePhaseMutation.mutate({ phase: selectedPhase });
  };

  const currentPhaseIndex = getPhaseIndex(currentPhase);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhaseStatus = (phaseKey: string) => {
    const phaseIndex = getPhaseIndex(phaseKey);
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Transaction Progress
          </CardTitle>
          {userRole === 'negotiator' && !isUpdating && (
            <div className="flex items-center gap-2">
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_PHASES.map((phase) => (
                    <SelectItem key={phase.key} value={phase.key}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPhase !== currentPhase && (
                <Button size="sm" onClick={handleUpdatePhase} disabled={updatePhaseMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updatePhaseMutation.isPending ? "Updating..." : "Update"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Phase Progress Visual */}
        <div className="space-y-4 mb-6">
          {TRANSACTION_PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase.key);
            const historyEntry = phaseHistory.find(h => h.phase_key === phase.key);
            
            return (
              <motion.div
                key={phase.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  status === 'completed' 
                    ? 'bg-green-100 text-green-600' 
                    : status === 'current'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : status === 'current' ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${
                      status === 'current' ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {phase.name}
                    </h4>
                    {status === 'current' && (
                      <Badge variant="default" className="bg-blue-100 text-blue-700">
                        Current
                      </Badge>
                    )}
                    {status === 'completed' && historyEntry && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Completed {formatDate(historyEntry.timestamp)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                </div>
                
                {index < TRANSACTION_PHASES.length - 1 && (
                  <ArrowRight className={`h-4 w-4 ${
                    status === 'completed' ? 'text-green-400' : 'text-gray-300'
                  }`} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current Phase Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">Current Phase</h5>
          <p className="text-blue-700">
            {TRANSACTION_PHASES.find(p => p.key === currentPhase)?.description || 'Phase description not available'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}