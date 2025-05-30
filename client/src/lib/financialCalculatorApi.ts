/**
 * Financial Calculator API Client
 * 
 * Client-side functions for interacting with the financial calculator service.
 * Provides typed interfaces for all 13 Fannie Mae calculator functions.
 */

import { queryClient } from './queryClient';

const API_BASE = '/api/v1/calculators';

// Types for calculator inputs and results
export interface DTICalculationInputs {
  monthlyPITI: number;
  grossMonthlyIncome: number;
  otherMonthlyDebts?: number;
  loanType?: 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Other';
}

export interface CashReservesInputs {
  checkingAccountBalance: number;
  savingsAccountBalance: number;
  moneyMarketBalance: number;
  stocksBondsValue: number;
  otherLiquidAssets: number;
}

export interface CashContributionInputs {
  nonRetirementCashReserves: number;
  contractualMonthlyPITI: number;
  estimatedDeficiency: number;
  housingExpenseToIncomeRatio?: number;
  isCurrentOrLessThan60DaysDelinquent?: boolean;
  isServicememberWithPCS?: boolean;
  loanType?: 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Other';
}

export interface PaymentDeferralEligibilityInputs {
  loanOriginationDate: string;
  evaluationDate?: string;
  loanMaturityDate: string;
  currentDelinquencyMonths: number;
  isDisasterRelated?: boolean;
  priorDeferralHistory?: Array<{
    effectiveDate: string;
    monthsDeferred: number;
    isDisasterRelated: boolean;
  }>;
  priorModificationHistory?: Array<{
    effectiveDate: string;
    type: 'FlexMod' | 'Other';
    trialPeriodFailed?: boolean;
  }>;
}

export interface LTVCalculationInputs {
  currentLoanBalance: number;
  propertyValueBefore: number;
  propertyValueAfter?: number;
  targetLTV?: number;
}

export interface RelocationAssistanceInputs {
  isPrincipalResidence: boolean;
  isCashContributionRequired: boolean;
  isServicememberWithPCS: boolean;
  receivingDLAOrGovernmentAid?: boolean;
}

export interface ShortSaleNetProceedsInputs {
  estimatedSalePrice: number;
  sellingCosts: {
    realEstateCommission: number;
    closingCosts: number;
    repairCosts: number;
    subordinateLienPayoffs: number;
    otherCosts: number;
  };
  unpaidPrincipalBalance: number;
  accruedInterest: number;
  otherAdvances: number;
}

export interface TrialPeriodPaymentInputs {
  principalAndInterest: number;
  monthlyPropertyTaxes: number;
  monthlyInsurance: number;
  otherEscrowAmounts?: number;
}

export interface RepaymentPlanInputs {
  fullMonthlyPITI: number;
  totalDelinquencyAmount: number;
  proposedRepaymentTermMonths: number;
}

export interface AffordabilityInputs {
  grossMonthlyIncome: number;
  proposedModifiedPITI: number;
  otherMonthlyDebts?: number;
  targetHousingDTI?: number;
  targetTotalDTI?: number;
}

export interface UBAFormEvaluationInputs {
  ubaFormId: string;
  evaluationType: 'short_sale' | 'deed_in_lieu' | 'modification' | 'payment_deferral';
  propertyValue?: number;
  estimatedSalePrice?: number;
  sellingCosts?: {
    realEstateCommission: number;
    closingCosts: number;
    repairCosts: number;
    subordinateLienPayoffs: number;
    otherCosts: number;
  };
}

// Generic calculation result interface
export interface CalculationResult<T = any> {
  calculationType: string;
  result: T;
  details?: Record<string, any>;
  warnings?: string[];
  guidelineReference?: string;
}

// API client functions
async function makeCalculatorRequest<T>(endpoint: string, data: any): Promise<CalculationResult<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Network error' } }));
    throw new Error(error.error?.message || 'Calculation failed');
  }

  return response.json();
}

export const financialCalculatorApi = {
  /**
   * Calculate Housing Expense-to-Income Ratio (Front-End DTI)
   */
  async calculateHousingDTI(inputs: DTICalculationInputs): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/housing-dti', inputs);
  },

  /**
   * Calculate Total Debt-to-Income Ratio (Back-End DTI)
   */
  async calculateTotalDTI(inputs: DTICalculationInputs): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/total-dti', inputs);
  },

  /**
   * Calculate Non-Taxable Income Gross-Up
   */
  async calculateIncomeGrossUp(nonTaxableIncome: number, grossUpPercentage?: number): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/income-gross-up', { 
      nonTaxableIncome, 
      grossUpPercentage 
    });
  },

  /**
   * Calculate Non-Retirement Cash Reserves
   */
  async calculateCashReserves(inputs: CashReservesInputs): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/cash-reserves', inputs);
  },

  /**
   * Calculate Cash Contribution for Short Sales/DIL
   */
  async calculateCashContribution(inputs: CashContributionInputs): Promise<CalculationResult<{
    contributionRequired: boolean;
    contributionAmount: number;
    contributionWaived: boolean;
    waiverReason?: string;
  }>> {
    return makeCalculatorRequest('/cash-contribution', inputs);
  },

  /**
   * Calculate Escrow Shortage Repayment
   */
  async calculateEscrowShortageRepayment(escrowShortageAmount: number, repaymentTermMonths?: number): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/escrow-shortage', { 
      escrowShortageAmount, 
      repaymentTermMonths 
    });
  },

  /**
   * Calculate Trial Period Payment
   */
  async calculateTrialPeriodPayment(inputs: TrialPeriodPaymentInputs): Promise<CalculationResult<number>> {
    return makeCalculatorRequest<number>('/trial-period-payment', inputs);
  },

  /**
   * Calculate Repayment Plan Parameters
   */
  async calculateRepaymentPlanParameters(inputs: RepaymentPlanInputs): Promise<CalculationResult<{
    isValidPlan: boolean;
    maxAllowablePayment: number;
    proposedPayment: number;
    exceedsPaymentLimit: boolean;
    exceedsTermLimit: boolean;
    warnings: string[];
  }>> {
    return makeCalculatorRequest('/repayment-plan', inputs);
  },

  /**
   * Calculate Payment Deferral Eligibility Metrics
   */
  async calculatePaymentDeferralEligibility(inputs: PaymentDeferralEligibilityInputs): Promise<CalculationResult<{
    loanOriginatedAtLeast12MonthsPrior: boolean;
    delinquencyInRange: boolean;
    cumulativeDeferralsUnder12Months: boolean;
    noPriorDeferralWithin12Months: boolean;
    notWithin36MonthsOfMaturity: boolean;
    overallEligible: boolean;
    warnings: string[];
  }>> {
    return makeCalculatorRequest('/payment-deferral-eligibility', inputs);
  },

  /**
   * Calculate Property LTV and Required Paydown
   */
  async calculatePropertyLTVAndPaydown(inputs: LTVCalculationInputs): Promise<CalculationResult<{
    ltvBefore: number;
    ltvAfter: number;
    requiresPaydown: boolean;
    requiredPaydownAmount: number;
    meetsTargetLTV: boolean;
  }>> {
    return makeCalculatorRequest('/property-ltv', inputs);
  },

  /**
   * Calculate Relocation Assistance Eligibility
   */
  async calculateRelocationAssistanceEligibility(inputs: RelocationAssistanceInputs): Promise<CalculationResult<{
    eligible: boolean;
    amount: number;
    ineligibilityReason?: string;
  }>> {
    return makeCalculatorRequest('/relocation-assistance', inputs);
  },

  /**
   * Calculate Short Sale Net Proceeds and Deficiency
   */
  async calculateShortSaleNetProceeds(inputs: ShortSaleNetProceedsInputs): Promise<CalculationResult<{
    grossProceeds: number;
    totalSellingCosts: number;
    netProceeds: number;
    totalAmountOwed: number;
    deficiencyAmount: number;
    recoveryPercentage: number;
  }>> {
    return makeCalculatorRequest('/short-sale-proceeds', inputs);
  },

  /**
   * Calculate Affordability for Loan Modifications
   */
  async calculateAffordabilityForModification(inputs: AffordabilityInputs): Promise<CalculationResult<{
    housingDTI: number;
    totalDTI: number;
    isAffordableHousing: boolean;
    isAffordableTotal: boolean;
    recommendedMaxPITI: number;
    recommendedMaxTotalPayments: number;
  }>> {
    return makeCalculatorRequest('/affordability-modification', inputs);
  },

  /**
   * Comprehensive UBA Form Evaluation
   */
  async evaluateUBAFormForWorkoutOption(inputs: UBAFormEvaluationInputs): Promise<{
    evaluationType: string;
    ubaFormId: string;
    formData: any;
    documentData: any;
    calculations: Record<string, any>;
    evaluationTimestamp: string;
  }> {
    const response = await fetch(`${API_BASE}/evaluate-uba-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(inputs)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Network error' } }));
      throw new Error(error.error?.message || 'Evaluation failed');
    }

    return response.json();
  },

  /**
   * Get Available Calculators
   */
  async getAvailableCalculators(): Promise<{
    calculators: Array<{
      name: string;
      description: string;
      guidelineReference: string;
    }>;
    totalCount: number;
    supportedLoanTypes: string[];
    guidelineReference: string;
  }> {
    const response = await fetch(`${API_BASE}/available`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available calculators');
    }

    return response.json();
  }
};

// Note: React Query hooks would go here if React Query is properly configured
// For now, use the direct API functions above

export default financialCalculatorApi;