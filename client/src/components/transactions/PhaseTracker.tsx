import React, { useState } from 'react';
import { format, addWeeks } from 'date-fns';
import { ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define the transaction phases
export const PHASES = [
  { id: 'intro', label: 'Introduction', description: 'Initial contact and setup' },
  { id: 'documents', label: 'Document Collection', description: 'Gathering necessary paperwork' },
  { id: 'offer_review', label: 'Offer Review', description: 'Evaluating purchase offers' },
  { id: 'offer_acceptance', label: 'Offer Acceptance', description: 'Finalizing purchase agreement' },
  { id: 'lender_approval', label: 'Lender Approval', description: 'Getting lender sign-off' },
  { id: 'escrow', label: 'Escrow', description: 'Managing escrow process' },
  { id: 'closing_docs', label: 'Closing Documents', description: 'Preparing final paperwork' },
  { id: 'funding', label: 'Funding', description: 'Securing transaction funding' },
  { id: 'closed', label: 'Closed', description: 'Transaction complete' },
];

// Calculate phase timing - simplified for MVP
const getPhaseEstimate = (
  creationDate: Date,
  phaseIndex: number
): { startDate: Date; endDate: Date } => {
  // Simple MVP estimation: Each phase is roughly 2 weeks
  const weeksPerPhase = 2;
  const startWeeks = phaseIndex * weeksPerPhase;
  const endWeeks = startWeeks + weeksPerPhase;

  return {
    startDate: addWeeks(creationDate, startWeeks),
    endDate: addWeeks(creationDate, endWeeks),
  };
};

interface PhaseTrackerProps {
  currentPhase: string;
  showTimeline?: boolean;
  creationDate?: Date;
  isEditable?: boolean;
  onPhaseChange?: (newPhase: string) => void;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({
  currentPhase,
  showTimeline = false,
  creationDate,
  isEditable = false,
  onPhaseChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(currentPhase);
  
  // Find the current phase index
  const currentPhaseIndex = PHASES.findIndex(phase => phase.id === currentPhase);
  const currentPhaseObj = PHASES[currentPhaseIndex] || PHASES[0];
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  // Handle phase change
  const handlePhaseChange = () => {
    if (onPhaseChange && selectedPhase !== currentPhase) {
      onPhaseChange(selectedPhase);
      setIsChangingPhase(false);
    }
  };
  
  // Cancel phase change
  const cancelPhaseChange = () => {
    setSelectedPhase(currentPhase);
    setIsChangingPhase(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
      {/* Collapsed View */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Current Phase
          </h3>
          {isChangingPhase ? (
            <div className="mt-2">
              <select 
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
              >
                {PHASES.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.label}
                  </option>
                ))}
              </select>
              
              <div className="mt-2 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handlePhaseChange}
                >
                  Update Phase
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={cancelPhaseChange}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-primary">
                {currentPhaseObj.label}
              </p>
              {isEditable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsChangingPhase(true)}
                  className="text-xs"
                >
                  Change
                </Button>
              )}
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse phase details" : "Expand phase details"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Expanded Timeline View */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-4">
            {PHASES.map((phase, index) => {
              const isComplete = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              let dateRangeText = '';
              if (showTimeline && creationDate && index <= currentPhaseIndex + 1) {
                const { startDate, endDate } = getPhaseEstimate(creationDate, index);
                dateRangeText = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
              }
              
              return (
                <div 
                  key={phase.id} 
                  className={cn(
                    "flex items-start gap-3 relative",
                    isCurrent && "text-primary font-medium"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div className="flex-shrink-0 mt-1">
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isCurrent ? (
                      <Circle className="h-5 w-5 text-primary fill-current opacity-20" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <p className={cn(
                        "font-medium",
                        isComplete && "text-green-500",
                        isCurrent && "text-primary"
                      )}>
                        {phase.label}
                      </p>
                      
                      {dateRangeText && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dateRangeText}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {phase.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaseTracker;