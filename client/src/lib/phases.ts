/**
 * Static Transaction Phases for ReAlign Tracker MVP
 * These phases represent the complete journey of a short sale transaction
 */

export interface TransactionPhase {
  key: string;
  name: string;
  description: string;
}

export const TRANSACTION_PHASES: TransactionPhase[] = [
  {
    key: 'Transaction Initiated',
    name: 'Transaction Initiated',
    description: 'Initial contact and transaction setup'
  },
  {
    key: 'Property Listing',
    name: 'Property Listing',
    description: 'Property is listed and marketed'
  },
  {
    key: 'Documentation Collection',
    name: 'Documentation Collection',
    description: 'Gathering necessary paperwork and documents'
  },
  {
    key: 'Hardship Package Submitted',
    name: 'Hardship Package Submitted',
    description: 'Complete hardship package sent to lender'
  },
  {
    key: 'Offer Received',
    name: 'Offer Received',
    description: 'Purchase offer received from buyer'
  },
  {
    key: 'Offer Submitted to Lender',
    name: 'Offer Submitted to Lender',
    description: 'Purchase offer forwarded to lender for review'
  },
  {
    key: 'Initial Lender Review',
    name: 'Initial Lender Review',
    description: 'Lender conducting initial offer evaluation'
  },
  {
    key: 'Property Valuation Ordered',
    name: 'Property Valuation Ordered',
    description: 'BPO or appraisal ordered by lender'
  },
  {
    key: 'Lender Negotiations',
    name: 'Lender Negotiations',
    description: 'Active negotiations with lender on terms'
  },
  {
    key: 'Final Approval Received',
    name: 'Final Approval Received',
    description: 'Lender has approved the short sale'
  },
  {
    key: 'In Closing',
    name: 'In Closing',
    description: 'Transaction is in escrow and closing process'
  }
];

/**
 * Get phase by key
 */
export const getPhaseByKey = (key: string): TransactionPhase | undefined => {
  return TRANSACTION_PHASES.find(phase => phase.key === key);
};

/**
 * Get phase index
 */
export const getPhaseIndex = (key: string): number => {
  return TRANSACTION_PHASES.findIndex(phase => phase.key === key);
};

/**
 * Get next phase
 */
export const getNextPhase = (currentKey: string): TransactionPhase | undefined => {
  const currentIndex = getPhaseIndex(currentKey);
  if (currentIndex >= 0 && currentIndex < TRANSACTION_PHASES.length - 1) {
    return TRANSACTION_PHASES[currentIndex + 1];
  }
  return undefined;
};

/**
 * Check if phase is complete (current phase is further along)
 */
export const isPhaseComplete = (phaseKey: string, currentPhaseKey: string): boolean => {
  const phaseIndex = getPhaseIndex(phaseKey);
  const currentIndex = getPhaseIndex(currentPhaseKey);
  return phaseIndex >= 0 && currentIndex >= 0 && phaseIndex < currentIndex;
};