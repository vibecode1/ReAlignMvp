/**
 * Unit Tests for Financial Calculator Service
 * 
 * Tests all calculator functions based on Fannie Mae Guidelines requirements.
 * Each test validates accuracy, edge cases, and guideline compliance.
 */

import { describe, test, expect } from '@jest/globals';
import FinancialCalculatorService, {
  DTICalculationInputs,
  CashReservesInputs,
  CashContributionInputs,
  PaymentDeferralEligibilityInputs,
  LTVCalculationInputs,
  RelocationAssistanceInputs,
  ShortSaleNetProceedsInputs
} from '../FinancialCalculatorService';

describe('FinancialCalculatorService', () => {

  describe('calculateHousingExpenseToIncomeRatio', () => {
    test('calculates correct housing DTI ratio', () => {
      const inputs: DTICalculationInputs = {
        monthlyPITI: 2000,
        grossMonthlyIncome: 5000
      };

      const result = FinancialCalculatorService.calculateHousingExpenseToIncomeRatio(inputs);

      expect(result.result).toBe(0.40);
      expect(result.details?.ratioPercentage).toBe(40);
      expect(result.warnings).toContain('Housing expense ratio ≤ 40% may trigger cash contribution requirement for short sales');
    });

    test('handles ratios above 40% threshold', () => {
      const inputs: DTICalculationInputs = {
        monthlyPITI: 2500,
        grossMonthlyIncome: 5000
      };

      const result = FinancialCalculatorService.calculateHousingExpenseToIncomeRatio(inputs);

      expect(result.result).toBe(0.50);
      expect(result.warnings).toHaveLength(0);
    });

    test('throws error for zero income', () => {
      const inputs: DTICalculationInputs = {
        monthlyPITI: 2000,
        grossMonthlyIncome: 0
      };

      expect(() => {
        FinancialCalculatorService.calculateHousingExpenseToIncomeRatio(inputs);
      }).toThrow('Gross monthly income must be greater than zero');
    });
  });

  describe('calculateTotalDebtToIncomeRatio', () => {
    test('calculates correct total DTI ratio with other debts', () => {
      const inputs: DTICalculationInputs = {
        monthlyPITI: 2000,
        grossMonthlyIncome: 5000,
        otherMonthlyDebts: 500
      };

      const result = FinancialCalculatorService.calculateTotalDebtToIncomeRatio(inputs);

      expect(result.result).toBe(0.50);
      expect(result.details?.totalMonthlyDebts).toBe(2500);
      expect(result.details?.ratioPercentage).toBe(50);
    });

    test('handles zero other debts', () => {
      const inputs: DTICalculationInputs = {
        monthlyPITI: 2000,
        grossMonthlyIncome: 5000
      };

      const result = FinancialCalculatorService.calculateTotalDebtToIncomeRatio(inputs);

      expect(result.result).toBe(0.40);
      expect(result.details?.otherMonthlyDebts).toBe(0);
    });
  });

  describe('calculateNonTaxableIncomeGrossUp', () => {
    test('applies default 25% gross-up correctly', () => {
      const result = FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(1000);

      expect(result.result).toBe(1250);
      expect(result.details?.grossUpAmount).toBe(250);
      expect(result.details?.grossUpPercentage).toBe(25);
    });

    test('applies custom gross-up percentage', () => {
      const result = FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(1000, 0.30);

      expect(result.result).toBe(1300);
      expect(result.details?.grossUpAmount).toBe(300);
      expect(result.details?.grossUpPercentage).toBe(30);
    });

    test('handles zero non-taxable income', () => {
      const result = FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(0);

      expect(result.result).toBe(0);
      expect(result.details?.grossUpAmount).toBe(0);
    });

    test('throws error for negative income', () => {
      expect(() => {
        FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(-1000);
      }).toThrow('Non-taxable income cannot be negative');
    });

    test('throws error for invalid gross-up percentage', () => {
      expect(() => {
        FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(1000, 1.5);
      }).toThrow('Gross-up percentage must be between 0 and 1');
    });
  });

  describe('calculateNonRetirementCashReserves', () => {
    test('sums all liquid assets correctly', () => {
      const inputs: CashReservesInputs = {
        checkingAccountBalance: 5000,
        savingsAccountBalance: 15000,
        moneyMarketBalance: 3000,
        stocksBondsValue: 7000,
        otherLiquidAssets: 2000
      };

      const result = FinancialCalculatorService.calculateNonRetirementCashReserves(inputs);

      expect(result.result).toBe(32000);
      expect(result.warnings).toContain('Cash reserves ≥ $25,000: May affect imminent default determination');
    });

    test('identifies $10,000 threshold warning', () => {
      const inputs: CashReservesInputs = {
        checkingAccountBalance: 8000,
        savingsAccountBalance: 3000,
        moneyMarketBalance: 0,
        stocksBondsValue: 0,
        otherLiquidAssets: 0
      };

      const result = FinancialCalculatorService.calculateNonRetirementCashReserves(inputs);

      expect(result.result).toBe(11000);
      expect(result.warnings).toContain('Cash reserves ≥ $10,000: May trigger cash contribution requirement for short sales/DILs');
    });

    test('identifies imminent default support for low reserves', () => {
      const inputs: CashReservesInputs = {
        checkingAccountBalance: 5000,
        savingsAccountBalance: 5000,
        moneyMarketBalance: 0,
        stocksBondsValue: 0,
        otherLiquidAssets: 0
      };

      const result = FinancialCalculatorService.calculateNonRetirementCashReserves(inputs);

      expect(result.result).toBe(10000);
      expect(result.warnings).toContain('Cash reserves < $25,000: Supports imminent default determination if other criteria met');
    });
  });

  describe('calculateCashContribution', () => {
    test('calculates contribution based on 20% of reserves when higher', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 50000,
        contractualMonthlyPITI: 2000,
        estimatedDeficiency: 20000
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionRequired).toBe(true);
      expect(result.result.contributionAmount).toBe(10000); // 20% of 50,000
      expect(result.result.contributionWaived).toBe(false);
    });

    test('calculates contribution based on 4x PITI when higher', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 15000,
        contractualMonthlyPITI: 2000,
        estimatedDeficiency: 20000
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionRequired).toBe(true);
      expect(result.result.contributionAmount).toBe(8000); // 4 x 2,000
      expect(result.result.contributionWaived).toBe(false);
    });

    test('caps contribution at deficiency amount', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 50000,
        contractualMonthlyPITI: 3000,
        estimatedDeficiency: 5000
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionRequired).toBe(true);
      expect(result.result.contributionAmount).toBe(5000); // Capped at deficiency
    });

    test('waives contribution under $500', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 2000,
        contractualMonthlyPITI: 100,
        estimatedDeficiency: 1000
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionRequired).toBe(true);
      expect(result.result.contributionWaived).toBe(true);
      expect(result.result.contributionAmount).toBe(0);
      expect(result.result.waiverReason).toContain('less than $500');
    });

    test('waives contribution for servicemember with PCS orders', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 30000,
        contractualMonthlyPITI: 2000,
        estimatedDeficiency: 15000,
        isServicememberWithPCS: true
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionWaived).toBe(true);
      expect(result.result.waiverReason).toContain('Servicemember with PCS orders');
    });

    test('requires contribution based on housing expense ratio', () => {
      const inputs: CashContributionInputs = {
        nonRetirementCashReserves: 5000, // Below $10K threshold
        contractualMonthlyPITI: 1500,
        estimatedDeficiency: 10000,
        housingExpenseToIncomeRatio: 0.35 // 35% - triggers contribution
      };

      const result = FinancialCalculatorService.calculateCashContribution(inputs);

      expect(result.result.contributionRequired).toBe(true);
      expect(result.details?.triggeredByHousingRatio).toBe(true);
    });
  });

  describe('calculateEscrowShortageRepayment', () => {
    test('calculates monthly repayment over default 60 months', () => {
      const result = FinancialCalculatorService.calculateEscrowShortageRepayment(6000);

      expect(result.result).toBe(100);
      expect(result.details?.repaymentTermMonths).toBe(60);
    });

    test('calculates monthly repayment over custom term', () => {
      const result = FinancialCalculatorService.calculateEscrowShortageRepayment(3600, 36);

      expect(result.result).toBe(100);
      expect(result.details?.repaymentTermMonths).toBe(36);
    });

    test('handles zero shortage amount', () => {
      const result = FinancialCalculatorService.calculateEscrowShortageRepayment(0);

      expect(result.result).toBe(0);
    });

    test('rounds to nearest cent', () => {
      const result = FinancialCalculatorService.calculateEscrowShortageRepayment(1000, 60);

      expect(result.result).toBe(16.67);
    });

    test('throws error for negative shortage', () => {
      expect(() => {
        FinancialCalculatorService.calculateEscrowShortageRepayment(-1000);
      }).toThrow('Escrow shortage amount cannot be negative');
    });
  });

  describe('calculateTrialPeriodPayment', () => {
    test('calculates total trial payment correctly', () => {
      const result = FinancialCalculatorService.calculateTrialPeriodPayment(
        1500, // P&I
        400,  // Property taxes
        150,  // Insurance
        50    // Other escrow (HOA)
      );

      expect(result.result).toBe(2100);
      expect(result.details?.totalTrialPayment).toBe(2100);
    });

    test('handles zero other escrow amounts', () => {
      const result = FinancialCalculatorService.calculateTrialPeriodPayment(1500, 400, 150);

      expect(result.result).toBe(2050);
      expect(result.details?.otherEscrowAmounts).toBe(0);
    });
  });

  describe('calculateRepaymentPlanParameters', () => {
    test('validates payment within 150% limit', () => {
      const result = FinancialCalculatorService.calculateRepaymentPlanParameters(
        2000, // Full monthly PITI
        6000, // Total delinquency
        12    // Repayment term months
      );

      expect(result.result.isValidPlan).toBe(true);
      expect(result.result.maxAllowablePayment).toBe(3000); // 150% of 2000
      expect(result.result.proposedPayment).toBe(2500); // 2000 + (6000/12)
      expect(result.result.exceedsPaymentLimit).toBe(false);
      expect(result.result.exceedsTermLimit).toBe(false);
    });

    test('identifies payment limit violation', () => {
      const result = FinancialCalculatorService.calculateRepaymentPlanParameters(
        2000, // Full monthly PITI
        15000, // High delinquency
        12     // Repayment term months
      );

      expect(result.result.isValidPlan).toBe(false);
      expect(result.result.exceedsPaymentLimit).toBe(true);
      expect(result.result.proposedPayment).toBe(3250); // 2000 + (15000/12)
      expect(result.result.warnings).toContain('exceeds 150% limit');
    });

    test('identifies term limit violation', () => {
      const result = FinancialCalculatorService.calculateRepaymentPlanParameters(
        2000,
        6000,
        48  // Exceeds 36-month limit
      );

      expect(result.result.isValidPlan).toBe(false);
      expect(result.result.exceedsTermLimit).toBe(true);
      expect(result.result.warnings).toContain('exceeds 36-month combined forbearance/repayment limit');
    });

    test('warns about 12+ month terms requiring approval', () => {
      const result = FinancialCalculatorService.calculateRepaymentPlanParameters(
        2000,
        3000,
        18
      );

      expect(result.result.warnings).toContain('exceeding 12 months requires prior written approval');
    });
  });

  describe('calculatePaymentDeferralEligibilityMetrics', () => {
    test('evaluates all criteria for eligible deferral', () => {
      const loanOriginationDate = new Date('2022-01-01');
      const evaluationDate = new Date('2024-06-01');
      const loanMaturityDate = new Date('2052-01-01');

      const inputs: PaymentDeferralEligibilityInputs = {
        loanOriginationDate,
        evaluationDate,
        loanMaturityDate,
        currentDelinquencyMonths: 3,
        priorDeferralHistory: [],
        priorModificationHistory: []
      };

      const result = FinancialCalculatorService.calculatePaymentDeferralEligibilityMetrics(inputs);

      expect(result.result.loanOriginatedAtLeast12MonthsPrior).toBe(true);
      expect(result.result.delinquencyInRange).toBe(true);
      expect(result.result.cumulativeDeferralsUnder12Months).toBe(true);
      expect(result.result.noPriorDeferralWithin12Months).toBe(true);
      expect(result.result.notWithin36MonthsOfMaturity).toBe(true);
      expect(result.result.overallEligible).toBe(true);
    });

    test('handles disaster-related delinquency range', () => {
      const inputs: PaymentDeferralEligibilityInputs = {
        loanOriginationDate: new Date('2022-01-01'),
        evaluationDate: new Date('2024-06-01'),
        loanMaturityDate: new Date('2052-01-01'),
        currentDelinquencyMonths: 1, // Valid for disaster (1-12 months)
        isDisasterRelated: true,
        priorDeferralHistory: [],
        priorModificationHistory: []
      };

      const result = FinancialCalculatorService.calculatePaymentDeferralEligibilityMetrics(inputs);

      expect(result.result.delinquencyInRange).toBe(true);
    });

    test('identifies cumulative deferral violation', () => {
      const inputs: PaymentDeferralEligibilityInputs = {
        loanOriginationDate: new Date('2022-01-01'),
        evaluationDate: new Date('2024-06-01'),
        loanMaturityDate: new Date('2052-01-01'),
        currentDelinquencyMonths: 3,
        priorDeferralHistory: [
          {
            effectiveDate: new Date('2023-01-01'),
            monthsDeferred: 8,
            isDisasterRelated: false
          },
          {
            effectiveDate: new Date('2023-09-01'),
            monthsDeferred: 6,
            isDisasterRelated: false
          }
        ],
        priorModificationHistory: []
      };

      const result = FinancialCalculatorService.calculatePaymentDeferralEligibilityMetrics(inputs);

      expect(result.result.cumulativeDeferralsUnder12Months).toBe(false);
      expect(result.result.overallEligible).toBe(false);
      expect(result.result.warnings).toContain('Cumulative non-disaster deferrals exceed 12 months (current: 14)');
    });

    test('identifies recent deferral violation', () => {
      const evaluationDate = new Date('2024-06-01');
      const recentDeferralDate = new Date('2024-01-01'); // Within 12 months

      const inputs: PaymentDeferralEligibilityInputs = {
        loanOriginationDate: new Date('2022-01-01'),
        evaluationDate,
        loanMaturityDate: new Date('2052-01-01'),
        currentDelinquencyMonths: 3,
        priorDeferralHistory: [
          {
            effectiveDate: recentDeferralDate,
            monthsDeferred: 3,
            isDisasterRelated: false
          }
        ],
        priorModificationHistory: []
      };

      const result = FinancialCalculatorService.calculatePaymentDeferralEligibilityMetrics(inputs);

      expect(result.result.noPriorDeferralWithin12Months).toBe(false);
      expect(result.result.overallEligible).toBe(false);
    });
  });

  describe('calculatePropertyLTVAndPaydown', () => {
    test('calculates LTV before and after correctly', () => {
      const inputs: LTVCalculationInputs = {
        currentLoanBalance: 300000,
        propertyValueBefore: 400000,
        propertyValueAfter: 350000,
        targetLTV: 0.60
      };

      const result = FinancialCalculatorService.calculatePropertyLTVAndPaydown(inputs);

      expect(result.result.ltvBefore).toBe(75); // 300k/400k = 0.75
      expect(result.result.ltvAfter).toBe(85.71); // 300k/350k ≈ 0.8571
      expect(result.result.requiresPaydown).toBe(true);
      expect(result.result.requiredPaydownAmount).toBe(90000); // 300k - (350k * 0.6)
      expect(result.result.meetsTargetLTV).toBe(false);
    });

    test('identifies when no paydown required', () => {
      const inputs: LTVCalculationInputs = {
        currentLoanBalance: 200000,
        propertyValueBefore: 400000,
        propertyValueAfter: 400000,
        targetLTV: 0.60
      };

      const result = FinancialCalculatorService.calculatePropertyLTVAndPaydown(inputs);

      expect(result.result.requiresPaydown).toBe(false);
      expect(result.result.requiredPaydownAmount).toBe(0);
      expect(result.result.meetsTargetLTV).toBe(true);
    });
  });

  describe('calculateRelocationAssistanceEligibility', () => {
    test('determines eligibility for principal residence', () => {
      const inputs: RelocationAssistanceInputs = {
        isPrincipalResidence: true,
        isCashContributionRequired: false,
        isServicememberWithPCS: false
      };

      const result = FinancialCalculatorService.calculateRelocationAssistanceEligibility(inputs);

      expect(result.result.eligible).toBe(true);
      expect(result.result.amount).toBe(7500);
    });

    test('denies eligibility for non-principal residence', () => {
      const inputs: RelocationAssistanceInputs = {
        isPrincipalResidence: false,
        isCashContributionRequired: false,
        isServicememberWithPCS: false
      };

      const result = FinancialCalculatorService.calculateRelocationAssistanceEligibility(inputs);

      expect(result.result.eligible).toBe(false);
      expect(result.result.amount).toBe(0);
      expect(result.result.ineligibilityReason).toContain('principal residence');
    });

    test('denies eligibility when cash contribution required', () => {
      const inputs: RelocationAssistanceInputs = {
        isPrincipalResidence: true,
        isCashContributionRequired: true,
        isServicememberWithPCS: false
      };

      const result = FinancialCalculatorService.calculateRelocationAssistanceEligibility(inputs);

      expect(result.result.eligible).toBe(false);
      expect(result.result.ineligibilityReason).toContain('cash contribution is required');
    });

    test('denies eligibility for servicemember receiving DLA', () => {
      const inputs: RelocationAssistanceInputs = {
        isPrincipalResidence: true,
        isCashContributionRequired: false,
        isServicememberWithPCS: true,
        receivingDLAOrGovernmentAid: true
      };

      const result = FinancialCalculatorService.calculateRelocationAssistanceEligibility(inputs);

      expect(result.result.eligible).toBe(false);
      expect(result.result.ineligibilityReason).toContain('DLA or other government relocation aid');
    });
  });

  describe('calculateShortSaleNetProceedsAndDeficiency', () => {
    test('calculates net proceeds and deficiency correctly', () => {
      const inputs: ShortSaleNetProceedsInputs = {
        estimatedSalePrice: 300000,
        sellingCosts: {
          realEstateCommission: 18000,
          closingCosts: 3000,
          repairCosts: 5000,
          subordinateLienPayoffs: 2000,
          otherCosts: 1000
        },
        unpaidPrincipalBalance: 320000,
        accruedInterest: 5000,
        otherAdvances: 2000
      };

      const result = FinancialCalculatorService.calculateShortSaleNetProceedsAndDeficiency(inputs);

      expect(result.result.grossProceeds).toBe(300000);
      expect(result.result.totalSellingCosts).toBe(29000);
      expect(result.result.netProceeds).toBe(271000);
      expect(result.result.totalAmountOwed).toBe(327000);
      expect(result.result.deficiencyAmount).toBe(56000);
      expect(result.result.recoveryPercentage).toBe(82.87);
    });

    test('handles no deficiency scenario', () => {
      const inputs: ShortSaleNetProceedsInputs = {
        estimatedSalePrice: 400000,
        sellingCosts: {
          realEstateCommission: 20000,
          closingCosts: 3000,
          repairCosts: 0,
          subordinateLienPayoffs: 0,
          otherCosts: 2000
        },
        unpaidPrincipalBalance: 300000,
        accruedInterest: 3000,
        otherAdvances: 1000
      };

      const result = FinancialCalculatorService.calculateShortSaleNetProceedsAndDeficiency(inputs);

      expect(result.result.netProceeds).toBe(375000);
      expect(result.result.totalAmountOwed).toBe(304000);
      expect(result.result.deficiencyAmount).toBe(0);
      expect(result.result.recoveryPercentage).toBeGreaterThan(100);
    });
  });

  describe('calculateAffordabilityForModification', () => {
    test('determines affordable modification', () => {
      const result = FinancialCalculatorService.calculateAffordabilityForModification(
        6000, // Gross monthly income
        1800, // Proposed modified PITI (30% of income)
        800   // Other monthly debts
      );

      expect(result.result.housingDTI).toBe(30); // 1800/6000
      expect(result.result.totalDTI).toBe(43.33); // (1800+800)/6000
      expect(result.result.isAffordableHousing).toBe(true); // 30% ≤ 31%
      expect(result.result.isAffordableTotal).toBe(false); // 43.33% > 43%
      expect(result.warnings).toContain('Total DTI 43.3% exceeds target 43%');
    });

    test('determines unaffordable modification', () => {
      const result = FinancialCalculatorService.calculateAffordabilityForModification(
        5000, // Gross monthly income
        1800, // Proposed modified PITI (36% of income)
        1000  // Other monthly debts
      );

      expect(result.result.housingDTI).toBe(36); // 1800/5000
      expect(result.result.totalDTI).toBe(56); // (1800+1000)/5000
      expect(result.result.isAffordableHousing).toBe(false); // 36% > 31%
      expect(result.result.isAffordableTotal).toBe(false); // 56% > 43%
      expect(result.warnings).toHaveLength(2);
    });

    test('calculates recommended maximum payments', () => {
      const result = FinancialCalculatorService.calculateAffordabilityForModification(6000, 1500, 500);

      expect(result.result.recommendedMaxPITI).toBe(1860); // 6000 * 0.31
      expect(result.result.recommendedMaxTotalPayments).toBe(2580); // 6000 * 0.43
    });
  });

  describe('getAvailableCalculators', () => {
    test('returns list of all available calculators', () => {
      const calculators = FinancialCalculatorService.getAvailableCalculators();

      expect(calculators).toHaveLength(13);
      expect(calculators[0]).toHaveProperty('name');
      expect(calculators[0]).toHaveProperty('description');
      expect(calculators[0]).toHaveProperty('guidelineReference');
      
      const calculatorNames = calculators.map(c => c.name);
      expect(calculatorNames).toContain('calculateHousingExpenseToIncomeRatio');
      expect(calculatorNames).toContain('calculateCashContribution');
      expect(calculatorNames).toContain('calculatePaymentDeferralEligibilityMetrics');
    });
  });
});

// Integration test examples that could be run against actual UBA form data
describe('FinancialCalculatorService Integration Examples', () => {
  test('complete short sale evaluation workflow', () => {
    // Mock UBA form data that would come from database
    const mockUBAFormData = {
      monthly_gross_income: 500000, // $5,000 in cents
      monthly_piti: 200000,         // $2,000 in cents
      checking_account_balance: 1500000, // $15,000 in cents
      savings_account_balance: 1000000,  // $10,000 in cents
      property_value: 35000000,     // $350,000 in cents
      loan_balance: 30000000        // $300,000 in cents
    };

    // Convert cents to dollars for calculator
    const grossIncome = mockUBAFormData.monthly_gross_income / 100;
    const monthlyPITI = mockUBAFormData.monthly_piti / 100;
    const cashReserves = (mockUBAFormData.checking_account_balance + mockUBAFormData.savings_account_balance) / 100;

    // Calculate housing DTI
    const housingDTI = FinancialCalculatorService.calculateHousingExpenseToIncomeRatio({
      monthlyPITI,
      grossMonthlyIncome: grossIncome
    });

    // Calculate cash reserves
    const reserves = FinancialCalculatorService.calculateNonRetirementCashReserves({
      checkingAccountBalance: mockUBAFormData.checking_account_balance / 100,
      savingsAccountBalance: mockUBAFormData.savings_account_balance / 100,
      moneyMarketBalance: 0,
      stocksBondsValue: 0,
      otherLiquidAssets: 0
    });

    // Calculate cash contribution requirement
    const cashContribution = FinancialCalculatorService.calculateCashContribution({
      nonRetirementCashReserves: cashReserves,
      contractualMonthlyPITI: monthlyPITI,
      estimatedDeficiency: 50000,
      housingExpenseToIncomeRatio: housingDTI.result
    });

    expect(housingDTI.result).toBe(0.40); // 40% DTI
    expect(reserves.result).toBe(25000);  // $25K cash reserves
    expect(cashContribution.result.contributionRequired).toBe(true);
    expect(cashContribution.result.contributionAmount).toBe(8000); // 4x monthly PITI
  });
});