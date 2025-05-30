/**
 * Financial Calculator Service for Loss Mitigation Options
 * 
 * This service implements calculation functions based on Fannie Mae Servicing Guide
 * requirements for evaluating borrower eligibility and terms for various workout options.
 * 
 * All calculations strictly adhere to the guidelines outlined in "Fannie Mae Guidelines.txt"
 * dated April 9, 2025.
 * 
 * @author ReAlign AI System
 * @version 1.0.0
 */

export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Other';

export interface CalculationResult<T = any> {
  result: T;
  details?: Record<string, any>;
  warnings?: string[];
  guidelineReference?: string;
}

export interface DTICalculationInputs {
  monthlyPITI: number;
  grossMonthlyIncome: number;
  otherMonthlyDebts?: number;
  loanType?: LoanType;
}

export interface CashReservesInputs {
  checkingAccountBalance: number;
  savingsAccountBalance: number;
  moneyMarketBalance: number;
  stocksBondsValue: number;
  otherLiquidAssets: number;
  excludeRetirementAccounts?: boolean;
}

export interface CashContributionInputs {
  nonRetirementCashReserves: number;
  contractualMonthlyPITI: number;
  estimatedDeficiency: number;
  housingExpenseToIncomeRatio?: number;
  isCurrentOrLessThan60DaysDelinquent?: boolean;
  isServicememberWithPCS?: boolean;
  loanType?: LoanType;
}

export interface PaymentDeferralEligibilityInputs {
  loanOriginationDate: Date;
  evaluationDate: Date;
  loanMaturityDate: Date;
  currentDelinquencyMonths: number;
  isDisasterRelated?: boolean;
  priorDeferralHistory: Array<{
    effectiveDate: Date;
    monthsDeferred: number;
    isDisasterRelated: boolean;
  }>;
  priorModificationHistory: Array<{
    effectiveDate: Date;
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

export class FinancialCalculatorService {

  /**
   * Calculates Housing Expense-to-Income Ratio (Front-End DTI)
   * 
   * Purpose: Determines total housing expenses (PITI) as a percentage of gross monthly income.
   * Used for short sale cash contribution evaluation per guideline reference.
   * 
   * @param inputs DTI calculation inputs
   * @returns Calculation result with ratio (e.g., 0.35 for 35%)
   * 
   * Guideline Reference: Line 120 - "housing expense-to-income ratio is 40% or less"
   * Used in short sale cash contribution determination.
   */
  static calculateHousingExpenseToIncomeRatio(inputs: DTICalculationInputs): CalculationResult<number> {
    const { monthlyPITI, grossMonthlyIncome } = inputs;

    if (grossMonthlyIncome <= 0) {
      throw new Error('Gross monthly income must be greater than zero');
    }

    const ratio = monthlyPITI / grossMonthlyIncome;
    const warnings: string[] = [];

    // Fannie Mae guideline: 40% threshold for short sale cash contribution
    if (ratio <= 0.40) {
      warnings.push('Housing expense ratio ≤ 40% may trigger cash contribution requirement for short sales');
    }

    return {
      result: ratio,
      details: {
        monthlyPITI,
        grossMonthlyIncome,
        ratioPercentage: Math.round(ratio * 10000) / 100 // Round to 2 decimal places
      },
      warnings,
      guidelineReference: 'Line 120: Short sale cash contribution based on housing expense-to-income ratio ≤ 40%'
    };
  }

  /**
   * Calculates Total Debt-to-Income Ratio (Back-End DTI)
   * 
   * Purpose: Determines total monthly debt payments (including PITI and other recurring debts)
   * as a percentage of gross monthly income for general affordability assessment.
   * 
   * @param inputs DTI calculation inputs with other monthly debts
   * @returns Calculation result with total DTI ratio
   * 
   * Guideline Reference: General affordability assessment standard throughout the guidelines
   */
  static calculateTotalDebtToIncomeRatio(inputs: DTICalculationInputs): CalculationResult<number> {
    const { monthlyPITI, grossMonthlyIncome, otherMonthlyDebts = 0 } = inputs;

    if (grossMonthlyIncome <= 0) {
      throw new Error('Gross monthly income must be greater than zero');
    }

    const totalMonthlyDebts = monthlyPITI + otherMonthlyDebts;
    const ratio = totalMonthlyDebts / grossMonthlyIncome;

    return {
      result: ratio,
      details: {
        monthlyPITI,
        otherMonthlyDebts,
        totalMonthlyDebts,
        grossMonthlyIncome,
        ratioPercentage: Math.round(ratio * 10000) / 100
      },
      guidelineReference: 'General affordability assessment for loan modifications and workout options'
    };
  }

  /**
   * Calculates Non-Taxable Income Gross-Up
   * 
   * Purpose: Adjusts non-taxable income for qualification by developing an "adjusted gross income"
   * by adding an equivalent amount to account for tax benefits.
   * 
   * @param nonTaxableIncome Amount of non-taxable income
   * @param grossUpPercentage Gross-up percentage (default 25% per guidelines)
   * @returns Calculation result with grossed-up income amount
   * 
   * Guideline Reference: Line 10 - "adding an amount equivalent to 25% of the non-taxable income"
   * Also Line 11 - "adding an amount equivalent to 25% of the amount documented"
   */
  static calculateNonTaxableIncomeGrossUp(
    nonTaxableIncome: number, 
    grossUpPercentage: number = 0.25
  ): CalculationResult<number> {
    if (nonTaxableIncome < 0) {
      throw new Error('Non-taxable income cannot be negative');
    }

    if (grossUpPercentage < 0 || grossUpPercentage > 1) {
      throw new Error('Gross-up percentage must be between 0 and 1');
    }

    const grossUpAmount = nonTaxableIncome * grossUpPercentage;
    const adjustedGrossIncome = nonTaxableIncome + grossUpAmount;

    return {
      result: adjustedGrossIncome,
      details: {
        originalNonTaxableIncome: nonTaxableIncome,
        grossUpPercentage: grossUpPercentage * 100,
        grossUpAmount,
        adjustedGrossIncome
      },
      guidelineReference: 'Lines 10-11: Non-taxable income grossed up by 25% or higher actual tax rate'
    };
  }

  /**
   * Calculates Non-Retirement Cash Reserves
   * 
   * Purpose: Sums borrower's liquid assets excluding retirement funds.
   * Used for $10,000 and $25,000 thresholds in short sales, DILs, and imminent default.
   * 
   * @param inputs Cash reserves calculation inputs
   * @returns Calculation result with total non-retirement cash reserves
   * 
   * Guideline Reference: Lines 93, 106, 120, 130 - $10,000 and $25,000 thresholds
   */
  static calculateNonRetirementCashReserves(inputs: CashReservesInputs): CalculationResult<number> {
    const {
      checkingAccountBalance,
      savingsAccountBalance,
      moneyMarketBalance,
      stocksBondsValue,
      otherLiquidAssets
    } = inputs;

    const totalReserves = checkingAccountBalance + savingsAccountBalance + 
                         moneyMarketBalance + stocksBondsValue + otherLiquidAssets;

    const warnings: string[] = [];

    // Key thresholds from Fannie Mae guidelines
    if (totalReserves >= 25000) {
      warnings.push('Cash reserves ≥ $25,000: May affect imminent default determination');
    } else if (totalReserves >= 10000) {
      warnings.push('Cash reserves ≥ $10,000: May trigger cash contribution requirement for short sales/DILs');
    } else if (totalReserves < 25000) {
      warnings.push('Cash reserves < $25,000: Supports imminent default determination if other criteria met');
    }

    return {
      result: totalReserves,
      details: {
        checkingAccountBalance,
        savingsAccountBalance,
        moneyMarketBalance,
        stocksBondsValue,
        otherLiquidAssets,
        totalReserves
      },
      warnings,
      guidelineReference: 'Lines 93, 106, 120, 130: $10K and $25K thresholds for cash contribution and imminent default'
    };
  }

  /**
   * Calculates Cash Contribution for Short Sales/Deed-in-Lieu
   * 
   * Purpose: Determines potential cash contribution required from borrower based on
   * cash reserves and housing expense ratio.
   * 
   * @param inputs Cash contribution calculation inputs
   * @returns Calculation result with cash contribution amount
   * 
   * Guideline Reference: Line 120 - Cash contribution calculation formula
   */
  static calculateCashContribution(inputs: CashContributionInputs): CalculationResult<{
    contributionRequired: boolean;
    contributionAmount: number;
    contributionWaived: boolean;
    waiverReason?: string;
  }> {
    const {
      nonRetirementCashReserves,
      contractualMonthlyPITI,
      estimatedDeficiency,
      housingExpenseToIncomeRatio,
      isCurrentOrLessThan60DaysDelinquent = false,
      isServicememberWithPCS = false
    } = inputs;

    let contributionRequired = false;
    let contributionAmount = 0;
    let contributionWaived = false;
    let waiverReason: string | undefined;

    // Check if contribution is required based on guidelines
    const cashReservesExceed10K = nonRetirementCashReserves > 10000;
    const housingRatio40OrLess = housingExpenseToIncomeRatio !== undefined && housingExpenseToIncomeRatio <= 0.40;

    if (cashReservesExceed10K || housingRatio40OrLess) {
      contributionRequired = true;

      // Calculate contribution: greater of 20% of reserves or 4x monthly PITI, not to exceed deficiency
      const twentyPercentReserves = nonRetirementCashReserves * 0.20;
      const fourTimesMonthlyPITI = contractualMonthlyPITI * 4;
      
      contributionAmount = Math.min(
        Math.max(twentyPercentReserves, fourTimesMonthlyPITI),
        estimatedDeficiency
      );

      // Check for mandatory contribution (current or <60 days delinquent)
      if (isCurrentOrLessThan60DaysDelinquent) {
        const minimumContribution = nonRetirementCashReserves * 0.20;
        contributionAmount = Math.max(contributionAmount, minimumContribution);
      }

      // Check for waiver conditions
      if (contributionAmount < 500) {
        contributionWaived = true;
        contributionAmount = 0;
        waiverReason = 'Contribution amount less than $500 - waived per guidelines';
      } else if (isServicememberWithPCS) {
        contributionWaived = true;
        contributionAmount = 0;
        waiverReason = 'Servicemember with PCS orders - contribution waived';
      }
    }

    return {
      result: {
        contributionRequired,
        contributionAmount: Math.round(contributionAmount * 100) / 100,
        contributionWaived,
        waiverReason
      },
      details: {
        nonRetirementCashReserves,
        contractualMonthlyPITI,
        estimatedDeficiency,
        housingExpenseToIncomeRatio,
        twentyPercentReserves: nonRetirementCashReserves * 0.20,
        fourTimesMonthlyPITI: contractualMonthlyPITI * 4,
        triggeredByCashReserves: cashReservesExceed10K,
        triggeredByHousingRatio: housingRatio40OrLess
      },
      guidelineReference: 'Line 120: Cash contribution = greater of 20% reserves or 4x monthly PITI, not exceeding deficiency'
    };
  }

  /**
   * Calculates Escrow Shortage Repayment
   * 
   * Purpose: Determines monthly payment needed to cure escrow shortage over defined period.
   * 
   * @param escrowShortageAmount Total escrow shortage amount
   * @param repaymentTermMonths Repayment term in months (default 60 per guidelines)
   * @returns Calculation result with monthly escrow shortage repayment
   * 
   * Guideline Reference: Lines 53, 74 - "repaying any escrow shortage over 60 months"
   */
  static calculateEscrowShortageRepayment(
    escrowShortageAmount: number,
    repaymentTermMonths: number = 60
  ): CalculationResult<number> {
    if (escrowShortageAmount < 0) {
      throw new Error('Escrow shortage amount cannot be negative');
    }

    if (repaymentTermMonths <= 0) {
      throw new Error('Repayment term must be greater than zero');
    }

    const monthlyRepaymentAmount = escrowShortageAmount / repaymentTermMonths;

    return {
      result: Math.round(monthlyRepaymentAmount * 100) / 100,
      details: {
        escrowShortageAmount,
        repaymentTermMonths,
        monthlyRepaymentAmount
      },
      guidelineReference: 'Lines 53, 74: Escrow shortage repayment over 60 months for payment deferrals'
    };
  }

  /**
   * Calculates Trial Period Payment for Loan Modifications
   * 
   * Purpose: Estimates total PITI payment for trial modification period.
   * 
   * @param principalAndInterest Modified P&I payment
   * @param monthlyPropertyTaxes Estimated monthly property taxes
   * @param monthlyInsurance Estimated monthly homeowners insurance
   * @param otherEscrowAmounts Other required monthly escrow (e.g., HOA)
   * @returns Calculation result with total trial period payment
   * 
   * Guideline Reference: Line 89 - Trial Period Plan requirement for Flex Modifications
   */
  static calculateTrialPeriodPayment(
    principalAndInterest: number,
    monthlyPropertyTaxes: number,
    monthlyInsurance: number,
    otherEscrowAmounts: number = 0
  ): CalculationResult<number> {
    const totalTrialPayment = principalAndInterest + monthlyPropertyTaxes + 
                             monthlyInsurance + otherEscrowAmounts;

    return {
      result: Math.round(totalTrialPayment * 100) / 100,
      details: {
        principalAndInterest,
        monthlyPropertyTaxes,
        monthlyInsurance,
        otherEscrowAmounts,
        totalTrialPayment
      },
      guidelineReference: 'Line 89: Trial Period Plan required for Fannie Mae Flex Modifications'
    };
  }

  /**
   * Calculates Forbearance/Repayment Plan Parameters
   * 
   * Purpose: Determines allowable payment amounts and durations for repayment plans.
   * 
   * @param fullMonthlyPITI Full monthly contractual PITI
   * @param totalDelinquencyAmount Total delinquency amount to cure
   * @param proposedRepaymentTermMonths Proposed repayment term
   * @returns Calculation result with repayment plan parameters
   * 
   * Guideline Reference: Lines 41, 45, 47 - 150% limit and 36-month combined limit
   */
  static calculateRepaymentPlanParameters(
    fullMonthlyPITI: number,
    totalDelinquencyAmount: number,
    proposedRepaymentTermMonths: number
  ): CalculationResult<{
    isValidPlan: boolean;
    maxAllowablePayment: number;
    proposedPayment: number;
    exceedsPaymentLimit: boolean;
    exceedsTermLimit: boolean;
    warnings: string[];
  }> {
    const maxAllowablePayment = fullMonthlyPITI * 1.50; // 150% limit
    const proposedMonthlyRepayment = totalDelinquencyAmount / proposedRepaymentTermMonths;
    const proposedPayment = fullMonthlyPITI + proposedMonthlyRepayment;
    
    const exceedsPaymentLimit = proposedPayment > maxAllowablePayment;
    const exceedsTermLimit = proposedRepaymentTermMonths > 36; // 36-month combined limit
    const isValidPlan = !exceedsPaymentLimit && !exceedsTermLimit;

    const warnings: string[] = [];
    
    if (exceedsPaymentLimit) {
      warnings.push(`Proposed payment $${proposedPayment.toFixed(2)} exceeds 150% limit of $${maxAllowablePayment.toFixed(2)}`);
    }
    
    if (exceedsTermLimit) {
      warnings.push(`Proposed term ${proposedRepaymentTermMonths} months exceeds 36-month combined forbearance/repayment limit`);
    }

    if (proposedRepaymentTermMonths > 12) {
      warnings.push('Repayment plan term exceeding 12 months requires prior written approval from Fannie Mae');
    }

    return {
      result: {
        isValidPlan,
        maxAllowablePayment: Math.round(maxAllowablePayment * 100) / 100,
        proposedPayment: Math.round(proposedPayment * 100) / 100,
        exceedsPaymentLimit,
        exceedsTermLimit,
        warnings
      },
      details: {
        fullMonthlyPITI,
        totalDelinquencyAmount,
        proposedRepaymentTermMonths,
        proposedMonthlyRepayment: Math.round(proposedMonthlyRepayment * 100) / 100
      },
      guidelineReference: 'Lines 41, 45, 47: Repayment payment ≤ 150% of PITI, combined period ≤ 36 months'
    };
  }

  /**
   * Calculates Payment Deferral Eligibility Metrics
   * 
   * Purpose: Evaluates various date-based and history-based criteria for payment deferral eligibility.
   * 
   * @param inputs Payment deferral eligibility inputs
   * @returns Calculation result with eligibility metrics
   * 
   * Guideline Reference: Lines 58-65 - Payment deferral eligibility criteria
   */
  static calculatePaymentDeferralEligibilityMetrics(
    inputs: PaymentDeferralEligibilityInputs
  ): CalculationResult<{
    loanOriginatedAtLeast12MonthsPrior: boolean;
    delinquencyInRange: boolean;
    cumulativeDeferralsUnder12Months: boolean;
    noPriorDeferralWithin12Months: boolean;
    notWithin36MonthsOfMaturity: boolean;
    overallEligible: boolean;
    warnings: string[];
  }> {
    const {
      loanOriginationDate,
      evaluationDate,
      loanMaturityDate,
      currentDelinquencyMonths,
      isDisasterRelated = false,
      priorDeferralHistory,
      priorModificationHistory
    } = inputs;

    const warnings: string[] = [];

    // 1. Loan originated ≥ 12 months prior
    const monthsSinceOrigination = this.calculateMonthsDifference(loanOriginationDate, evaluationDate);
    const loanOriginatedAtLeast12MonthsPrior = monthsSinceOrigination >= 12;

    // 2. Current delinquency status check
    let delinquencyInRange: boolean;
    if (isDisasterRelated) {
      delinquencyInRange = currentDelinquencyMonths >= 1 && currentDelinquencyMonths <= 12;
    } else {
      delinquencyInRange = currentDelinquencyMonths >= 2 && currentDelinquencyMonths <= 6;
    }

    // 3. Cumulative non-disaster P&I deferrals ≤ 12 months
    const nonDisasterDeferrals = priorDeferralHistory.filter(d => !d.isDisasterRelated);
    const totalNonDisasterMonthsDeferred = nonDisasterDeferrals.reduce((sum, d) => sum + d.monthsDeferred, 0);
    const cumulativeDeferralsUnder12Months = totalNonDisasterMonthsDeferred <= 12;

    // 4. No non-disaster deferral within last 12 months
    const twelveMonthsAgo = new Date(evaluationDate);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const recentNonDisasterDeferrals = nonDisasterDeferrals.filter(
      d => d.effectiveDate >= twelveMonthsAgo
    );
    const noPriorDeferralWithin12Months = recentNonDisasterDeferrals.length === 0;

    // 5. Not within 36 months of maturity
    const monthsUntilMaturity = this.calculateMonthsDifference(evaluationDate, loanMaturityDate);
    const notWithin36MonthsOfMaturity = monthsUntilMaturity > 36;

    // Overall eligibility
    const overallEligible = loanOriginatedAtLeast12MonthsPrior && 
                           delinquencyInRange && 
                           cumulativeDeferralsUnder12Months && 
                           noPriorDeferralWithin12Months && 
                           notWithin36MonthsOfMaturity;

    // Add warnings for failed criteria
    if (!loanOriginatedAtLeast12MonthsPrior) {
      warnings.push(`Loan must be originated ≥12 months prior (current: ${monthsSinceOrigination} months)`);
    }
    if (!delinquencyInRange) {
      const rangeText = isDisasterRelated ? '1-12 months' : '2-6 months';
      warnings.push(`Delinquency must be ${rangeText} (current: ${currentDelinquencyMonths} months)`);
    }
    if (!cumulativeDeferralsUnder12Months) {
      warnings.push(`Cumulative non-disaster deferrals exceed 12 months (current: ${totalNonDisasterMonthsDeferred})`);
    }
    if (!noPriorDeferralWithin12Months) {
      warnings.push('Prior non-disaster deferral within last 12 months');
    }
    if (!notWithin36MonthsOfMaturity) {
      warnings.push(`Loan within 36 months of maturity (${monthsUntilMaturity} months remaining)`);
    }

    return {
      result: {
        loanOriginatedAtLeast12MonthsPrior,
        delinquencyInRange,
        cumulativeDeferralsUnder12Months,
        noPriorDeferralWithin12Months,
        notWithin36MonthsOfMaturity,
        overallEligible,
        warnings
      },
      details: {
        monthsSinceOrigination,
        currentDelinquencyMonths,
        totalNonDisasterMonthsDeferred,
        monthsUntilMaturity,
        isDisasterRelated
      },
      guidelineReference: 'Lines 58-65: Payment deferral eligibility criteria including timing and history requirements'
    };
  }

  /**
   * Calculates Property LTV and Required Paydown
   * 
   * Purpose: Calculates LTV before/after property action and required paydown for target LTV.
   * 
   * @param inputs LTV calculation inputs
   * @returns Calculation result with LTV metrics and paydown requirements
   * 
   * Guideline Reference: Lines 158, 161-167 - 60% LTV target for property-related requests
   */
  static calculatePropertyLTVAndPaydown(inputs: LTVCalculationInputs): CalculationResult<{
    ltvBefore: number;
    ltvAfter: number;
    requiresPaydown: boolean;
    requiredPaydownAmount: number;
    meetsTargetLTV: boolean;
  }> {
    const {
      currentLoanBalance,
      propertyValueBefore,
      propertyValueAfter = propertyValueBefore,
      targetLTV = 0.60
    } = inputs;

    const ltvBefore = currentLoanBalance / propertyValueBefore;
    const ltvAfter = currentLoanBalance / propertyValueAfter;
    
    const requiresPaydown = ltvAfter > targetLTV;
    let requiredPaydownAmount = 0;
    
    if (requiresPaydown) {
      requiredPaydownAmount = currentLoanBalance - (propertyValueAfter * targetLTV);
    }
    
    const meetsTargetLTV = ltvAfter <= targetLTV;

    return {
      result: {
        ltvBefore: Math.round(ltvBefore * 10000) / 100,
        ltvAfter: Math.round(ltvAfter * 10000) / 100,
        requiresPaydown,
        requiredPaydownAmount: Math.round(requiredPaydownAmount * 100) / 100,
        meetsTargetLTV
      },
      details: {
        currentLoanBalance,
        propertyValueBefore,
        propertyValueAfter,
        targetLTV: targetLTV * 100,
        targetLoanBalance: propertyValueAfter * targetLTV
      },
      guidelineReference: 'Lines 158, 161-167: Property-related requests target LTV < 60% or require paydown'
    };
  }

  /**
   * Calculates Relocation Assistance Eligibility
   * 
   * Purpose: Determines borrower eligibility for $7,500 relocation assistance.
   * 
   * @param inputs Relocation assistance eligibility inputs
   * @returns Calculation result with eligibility and amount
   * 
   * Guideline Reference: Lines 121, 149 - $7,500 relocation assistance conditions
   */
  static calculateRelocationAssistanceEligibility(
    inputs: RelocationAssistanceInputs
  ): CalculationResult<{
    eligible: boolean;
    amount: number;
    ineligibilityReason?: string;
  }> {
    const {
      isPrincipalResidence,
      isCashContributionRequired,
      isServicememberWithPCS,
      receivingDLAOrGovernmentAid = false
    } = inputs;

    let eligible = true;
    let amount = 7500;
    let ineligibilityReason: string | undefined;

    // Check eligibility conditions
    if (!isPrincipalResidence) {
      eligible = false;
      amount = 0;
      ineligibilityReason = 'Property must be borrower\'s principal residence';
    } else if (isCashContributionRequired) {
      eligible = false;
      amount = 0;
      ineligibilityReason = 'Not eligible when cash contribution is required (even if not made)';
    } else if (isServicememberWithPCS && receivingDLAOrGovernmentAid) {
      eligible = false;
      amount = 0;
      ineligibilityReason = 'Servicemember with PCS orders receiving DLA or other government relocation aid';
    }

    return {
      result: {
        eligible,
        amount,
        ineligibilityReason
      },
      details: {
        isPrincipalResidence,
        isCashContributionRequired,
        isServicememberWithPCS,
        receivingDLAOrGovernmentAid
      },
      guidelineReference: 'Lines 121, 149: $7,500 relocation assistance for principal residence, excluding cash contribution cases'
    };
  }

  /**
   * Estimates Short Sale Net Proceeds and Deficiency
   * 
   * Purpose: Calculates estimated net proceeds to lender and resulting deficiency.
   * 
   * @param inputs Short sale calculation inputs
   * @returns Calculation result with net proceeds and deficiency estimates
   * 
   * Guideline Reference: Implicit for short sale evaluations throughout guidelines
   */
  static calculateShortSaleNetProceedsAndDeficiency(
    inputs: ShortSaleNetProceedsInputs
  ): CalculationResult<{
    grossProceeds: number;
    totalSellingCosts: number;
    netProceeds: number;
    totalAmountOwed: number;
    deficiencyAmount: number;
    recoveryPercentage: number;
  }> {
    const {
      estimatedSalePrice,
      sellingCosts,
      unpaidPrincipalBalance,
      accruedInterest,
      otherAdvances
    } = inputs;

    const grossProceeds = estimatedSalePrice;
    const totalSellingCosts = Object.values(sellingCosts).reduce((sum, cost) => sum + cost, 0);
    const netProceeds = grossProceeds - totalSellingCosts;
    const totalAmountOwed = unpaidPrincipalBalance + accruedInterest + otherAdvances;
    const deficiencyAmount = Math.max(0, totalAmountOwed - netProceeds);
    const recoveryPercentage = netProceeds / totalAmountOwed;

    return {
      result: {
        grossProceeds: Math.round(grossProceeds * 100) / 100,
        totalSellingCosts: Math.round(totalSellingCosts * 100) / 100,
        netProceeds: Math.round(netProceeds * 100) / 100,
        totalAmountOwed: Math.round(totalAmountOwed * 100) / 100,
        deficiencyAmount: Math.round(deficiencyAmount * 100) / 100,
        recoveryPercentage: Math.round(recoveryPercentage * 10000) / 100
      },
      details: {
        estimatedSalePrice,
        sellingCosts,
        unpaidPrincipalBalance,
        accruedInterest,
        otherAdvances
      },
      guidelineReference: 'Implicit calculation for short sale evaluation and deficiency determination'
    };
  }

  /**
   * Calculates Affordability for Loan Modifications
   * 
   * Purpose: Assesses if proposed modified PITI is affordable by targeting percentage of GMI.
   * 
   * @param grossMonthlyIncome Gross monthly income (including grossed-up non-taxable)
   * @param proposedModifiedPITI Proposed modified PITI payment
   * @param otherMonthlyDebts Other monthly debt obligations
   * @param targetHousingDTI Target housing DTI ratio (default 31%)
   * @param targetTotalDTI Target total DTI ratio (default 43%)
   * @returns Calculation result with affordability assessment
   * 
   * Guideline Reference: Goal of Flex Modifications per lines 85-100
   */
  static calculateAffordabilityForModification(
    grossMonthlyIncome: number,
    proposedModifiedPITI: number,
    otherMonthlyDebts: number = 0,
    targetHousingDTI: number = 0.31,
    targetTotalDTI: number = 0.43
  ): CalculationResult<{
    housingDTI: number;
    totalDTI: number;
    isAffordableHousing: boolean;
    isAffordableTotal: boolean;
    recommendedMaxPITI: number;
    recommendedMaxTotalPayments: number;
  }> {
    const housingDTI = proposedModifiedPITI / grossMonthlyIncome;
    const totalDTI = (proposedModifiedPITI + otherMonthlyDebts) / grossMonthlyIncome;
    
    const isAffordableHousing = housingDTI <= targetHousingDTI;
    const isAffordableTotal = totalDTI <= targetTotalDTI;
    
    const recommendedMaxPITI = grossMonthlyIncome * targetHousingDTI;
    const recommendedMaxTotalPayments = grossMonthlyIncome * targetTotalDTI;

    const warnings: string[] = [];
    if (!isAffordableHousing) {
      warnings.push(`Housing DTI ${(housingDTI * 100).toFixed(1)}% exceeds target ${(targetHousingDTI * 100)}%`);
    }
    if (!isAffordableTotal) {
      warnings.push(`Total DTI ${(totalDTI * 100).toFixed(1)}% exceeds target ${(targetTotalDTI * 100)}%`);
    }

    return {
      result: {
        housingDTI: Math.round(housingDTI * 10000) / 100,
        totalDTI: Math.round(totalDTI * 10000) / 100,
        isAffordableHousing,
        isAffordableTotal,
        recommendedMaxPITI: Math.round(recommendedMaxPITI * 100) / 100,
        recommendedMaxTotalPayments: Math.round(recommendedMaxTotalPayments * 100) / 100
      },
      details: {
        grossMonthlyIncome,
        proposedModifiedPITI,
        otherMonthlyDebts,
        targetHousingDTI: targetHousingDTI * 100,
        targetTotalDTI: targetTotalDTI * 100
      },
      warnings,
      guidelineReference: 'Lines 85-100: Goal of Fannie Mae Flex Modifications for affordability'
    };
  }

  /**
   * Helper method to calculate months difference between two dates
   * @private
   */
  private static calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Gets all available calculator functions with their descriptions
   * 
   * @returns Array of calculator function metadata
   */
  static getAvailableCalculators(): Array<{
    name: string;
    description: string;
    guidelineReference: string;
  }> {
    return [
      {
        name: 'calculateHousingExpenseToIncomeRatio',
        description: 'Calculates housing expense-to-income ratio (front-end DTI)',
        guidelineReference: 'Line 120: Short sale cash contribution evaluation'
      },
      {
        name: 'calculateTotalDebtToIncomeRatio',
        description: 'Calculates total debt-to-income ratio (back-end DTI)',
        guidelineReference: 'General affordability assessment'
      },
      {
        name: 'calculateNonTaxableIncomeGrossUp',
        description: 'Adjusts non-taxable income by adding 25% gross-up',
        guidelineReference: 'Lines 10-11: Non-taxable income adjustment'
      },
      {
        name: 'calculateNonRetirementCashReserves',
        description: 'Sums liquid assets excluding retirement funds',
        guidelineReference: 'Lines 93, 106, 120, 130: $10K and $25K thresholds'
      },
      {
        name: 'calculateCashContribution',
        description: 'Determines cash contribution for short sales/DILs',
        guidelineReference: 'Line 120: Cash contribution formula'
      },
      {
        name: 'calculateEscrowShortageRepayment',
        description: 'Calculates monthly escrow shortage repayment over 60 months',
        guidelineReference: 'Lines 53, 74: Escrow shortage repayment'
      },
      {
        name: 'calculateTrialPeriodPayment',
        description: 'Estimates total PITI for trial modification period',
        guidelineReference: 'Line 89: Trial Period Plan requirement'
      },
      {
        name: 'calculateRepaymentPlanParameters',
        description: 'Validates repayment plan payments and terms',
        guidelineReference: 'Lines 41, 45, 47: 150% limit and 36-month limit'
      },
      {
        name: 'calculatePaymentDeferralEligibilityMetrics',
        description: 'Evaluates payment deferral eligibility criteria',
        guidelineReference: 'Lines 58-65: Payment deferral requirements'
      },
      {
        name: 'calculatePropertyLTVAndPaydown',
        description: 'Calculates LTV and required paydown for 60% target',
        guidelineReference: 'Lines 158, 161-167: Property-related LTV requirements'
      },
      {
        name: 'calculateRelocationAssistanceEligibility',
        description: 'Determines $7,500 relocation assistance eligibility',
        guidelineReference: 'Lines 121, 149: Relocation assistance conditions'
      },
      {
        name: 'calculateShortSaleNetProceedsAndDeficiency',
        description: 'Estimates net proceeds and deficiency for short sales',
        guidelineReference: 'Implicit for short sale evaluation'
      },
      {
        name: 'calculateAffordabilityForModification',
        description: 'Assesses affordability of proposed modified payments',
        guidelineReference: 'Lines 85-100: Flex Modification goals'
      }
    ];
  }
}

export default FinancialCalculatorService;