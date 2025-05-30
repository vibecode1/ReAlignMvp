/**
 * Financial Calculator Controller
 * 
 * Provides API endpoints for all financial calculations based on Fannie Mae Guidelines.
 * These endpoints support loss mitigation evaluation and borrower assistance programs.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import FinancialCalculatorService, {
  DTICalculationInputs,
  CashReservesInputs,
  CashContributionInputs,
  PaymentDeferralEligibilityInputs,
  LTVCalculationInputs,
  RelocationAssistanceInputs,
  ShortSaleNetProceedsInputs,
  LoanType
} from '../services/FinancialCalculatorService';
import { storage } from '../storage';

// Validation schemas
const DTICalculationSchema = z.object({
  monthlyPITI: z.number().positive(),
  grossMonthlyIncome: z.number().positive(),
  otherMonthlyDebts: z.number().min(0).optional(),
  loanType: z.enum(['Conventional', 'FHA', 'VA', 'USDA', 'Other']).optional()
});

const CashReservesSchema = z.object({
  checkingAccountBalance: z.number().min(0),
  savingsAccountBalance: z.number().min(0),
  moneyMarketBalance: z.number().min(0),
  stocksBondsValue: z.number().min(0),
  otherLiquidAssets: z.number().min(0)
});

const CashContributionSchema = z.object({
  nonRetirementCashReserves: z.number().min(0),
  contractualMonthlyPITI: z.number().positive(),
  estimatedDeficiency: z.number().min(0),
  housingExpenseToIncomeRatio: z.number().min(0).max(10).optional(),
  isCurrentOrLessThan60DaysDelinquent: z.boolean().optional(),
  isServicememberWithPCS: z.boolean().optional(),
  loanType: z.enum(['Conventional', 'FHA', 'VA', 'USDA', 'Other']).optional()
});

const PaymentDeferralEligibilitySchema = z.object({
  loanOriginationDate: z.string().datetime(),
  evaluationDate: z.string().datetime().optional(),
  loanMaturityDate: z.string().datetime(),
  currentDelinquencyMonths: z.number().int().min(0),
  isDisasterRelated: z.boolean().optional(),
  priorDeferralHistory: z.array(z.object({
    effectiveDate: z.string().datetime(),
    monthsDeferred: z.number().int().positive(),
    isDisasterRelated: z.boolean()
  })).optional(),
  priorModificationHistory: z.array(z.object({
    effectiveDate: z.string().datetime(),
    type: z.enum(['FlexMod', 'Other']),
    trialPeriodFailed: z.boolean().optional()
  })).optional()
});

const LTVCalculationSchema = z.object({
  currentLoanBalance: z.number().positive(),
  propertyValueBefore: z.number().positive(),
  propertyValueAfter: z.number().positive().optional(),
  targetLTV: z.number().min(0).max(1).optional()
});

const RelocationAssistanceSchema = z.object({
  isPrincipalResidence: z.boolean(),
  isCashContributionRequired: z.boolean(),
  isServicememberWithPCS: z.boolean(),
  receivingDLAOrGovernmentAid: z.boolean().optional()
});

const ShortSaleNetProceedsSchema = z.object({
  estimatedSalePrice: z.number().positive(),
  sellingCosts: z.object({
    realEstateCommission: z.number().min(0),
    closingCosts: z.number().min(0),
    repairCosts: z.number().min(0),
    subordinateLienPayoffs: z.number().min(0),
    otherCosts: z.number().min(0)
  }),
  unpaidPrincipalBalance: z.number().positive(),
  accruedInterest: z.number().min(0),
  otherAdvances: z.number().min(0)
});

const TrialPeriodPaymentSchema = z.object({
  principalAndInterest: z.number().positive(),
  monthlyPropertyTaxes: z.number().min(0),
  monthlyInsurance: z.number().positive(),
  otherEscrowAmounts: z.number().min(0).optional()
});

const RepaymentPlanSchema = z.object({
  fullMonthlyPITI: z.number().positive(),
  totalDelinquencyAmount: z.number().positive(),
  proposedRepaymentTermMonths: z.number().int().positive()
});

const AffordabilitySchema = z.object({
  grossMonthlyIncome: z.number().positive(),
  proposedModifiedPITI: z.number().positive(),
  otherMonthlyDebts: z.number().min(0).optional(),
  targetHousingDTI: z.number().min(0).max(1).optional(),
  targetTotalDTI: z.number().min(0).max(1).optional()
});

const UBAFormEvaluationSchema = z.object({
  ubaFormId: z.string().uuid(),
  evaluationType: z.enum(['short_sale', 'deed_in_lieu', 'modification', 'payment_deferral']),
  propertyValue: z.number().positive().optional(),
  estimatedSalePrice: z.number().positive().optional(),
  sellingCosts: z.object({
    realEstateCommission: z.number().min(0),
    closingCosts: z.number().min(0),
    repairCosts: z.number().min(0),
    subordinateLienPayoffs: z.number().min(0),
    otherCosts: z.number().min(0)
  }).optional()
});

export const financialCalculatorController = {

  /**
   * Calculate Housing Expense-to-Income Ratio (Front-End DTI)
   */
  async calculateHousingDTI(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = DTICalculationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calculation inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateHousingExpenseToIncomeRatio(validation.data);

      // Log the calculation
      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'ai_recommendation_generated',
        event_category: 'financial_calculation',
        event_name: 'housing_dti_calculated',
        event_description: `Calculated housing DTI: ${(result.result * 100).toFixed(1)}%`,
        success_indicator: true,
        event_metadata: JSON.stringify({
          calculation_type: 'housing_dti',
          ratio: result.result,
          monthly_piti: validation.data.monthlyPITI,
          gross_monthly_income: validation.data.grossMonthlyIncome
        })
      });

      return res.status(200).json({
        calculationType: 'housing_expense_to_income_ratio',
        ...result
      });
    } catch (error) {
      console.error('Housing DTI calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate housing DTI'
        }
      });
    }
  },

  /**
   * Calculate Total Debt-to-Income Ratio (Back-End DTI)
   */
  async calculateTotalDTI(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = DTICalculationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calculation inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateTotalDebtToIncomeRatio(validation.data);

      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'ai_recommendation_generated',
        event_category: 'financial_calculation',
        event_name: 'total_dti_calculated',
        event_description: `Calculated total DTI: ${(result.result * 100).toFixed(1)}%`,
        success_indicator: true,
        event_metadata: JSON.stringify({
          calculation_type: 'total_dti',
          ratio: result.result,
          monthly_piti: validation.data.monthlyPITI,
          other_monthly_debts: validation.data.otherMonthlyDebts || 0,
          gross_monthly_income: validation.data.grossMonthlyIncome
        })
      });

      return res.status(200).json({
        calculationType: 'total_debt_to_income_ratio',
        ...result
      });
    } catch (error) {
      console.error('Total DTI calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate total DTI'
        }
      });
    }
  },

  /**
   * Calculate Non-Taxable Income Gross-Up
   */
  async calculateIncomeGrossUp(req: AuthenticatedRequest, res: Response) {
    try {
      const { nonTaxableIncome, grossUpPercentage } = req.body;

      if (typeof nonTaxableIncome !== 'number' || nonTaxableIncome < 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Non-taxable income must be a positive number'
          }
        });
      }

      const result = FinancialCalculatorService.calculateNonTaxableIncomeGrossUp(
        nonTaxableIncome,
        grossUpPercentage
      );

      return res.status(200).json({
        calculationType: 'non_taxable_income_gross_up',
        ...result
      });
    } catch (error) {
      console.error('Income gross-up calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate income gross-up'
        }
      });
    }
  },

  /**
   * Calculate Non-Retirement Cash Reserves
   */
  async calculateCashReserves(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = CashReservesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cash reserves inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateNonRetirementCashReserves(validation.data);

      return res.status(200).json({
        calculationType: 'non_retirement_cash_reserves',
        ...result
      });
    } catch (error) {
      console.error('Cash reserves calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate cash reserves'
        }
      });
    }
  },

  /**
   * Calculate Cash Contribution for Short Sales/DIL
   */
  async calculateCashContribution(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = CashContributionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cash contribution inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateCashContribution(validation.data);

      return res.status(200).json({
        calculationType: 'cash_contribution',
        ...result
      });
    } catch (error) {
      console.error('Cash contribution calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate cash contribution'
        }
      });
    }
  },

  /**
   * Calculate Escrow Shortage Repayment
   */
  async calculateEscrowShortageRepayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { escrowShortageAmount, repaymentTermMonths } = req.body;

      if (typeof escrowShortageAmount !== 'number' || escrowShortageAmount < 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Escrow shortage amount must be a positive number'
          }
        });
      }

      const result = FinancialCalculatorService.calculateEscrowShortageRepayment(
        escrowShortageAmount,
        repaymentTermMonths
      );

      return res.status(200).json({
        calculationType: 'escrow_shortage_repayment',
        ...result
      });
    } catch (error) {
      console.error('Escrow shortage calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate escrow shortage repayment'
        }
      });
    }
  },

  /**
   * Calculate Trial Period Payment
   */
  async calculateTrialPeriodPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = TrialPeriodPaymentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid trial period payment inputs',
            details: validation.error.errors
          }
        });
      }

      const { principalAndInterest, monthlyPropertyTaxes, monthlyInsurance, otherEscrowAmounts } = validation.data;

      const result = FinancialCalculatorService.calculateTrialPeriodPayment(
        principalAndInterest,
        monthlyPropertyTaxes,
        monthlyInsurance,
        otherEscrowAmounts
      );

      return res.status(200).json({
        calculationType: 'trial_period_payment',
        ...result
      });
    } catch (error) {
      console.error('Trial period payment calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate trial period payment'
        }
      });
    }
  },

  /**
   * Calculate Repayment Plan Parameters
   */
  async calculateRepaymentPlanParameters(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = RepaymentPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid repayment plan inputs',
            details: validation.error.errors
          }
        });
      }

      const { fullMonthlyPITI, totalDelinquencyAmount, proposedRepaymentTermMonths } = validation.data;

      const result = FinancialCalculatorService.calculateRepaymentPlanParameters(
        fullMonthlyPITI,
        totalDelinquencyAmount,
        proposedRepaymentTermMonths
      );

      return res.status(200).json({
        calculationType: 'repayment_plan_parameters',
        ...result
      });
    } catch (error) {
      console.error('Repayment plan calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate repayment plan parameters'
        }
      });
    }
  },

  /**
   * Calculate Payment Deferral Eligibility Metrics
   */
  async calculatePaymentDeferralEligibility(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = PaymentDeferralEligibilitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment deferral eligibility inputs',
            details: validation.error.errors
          }
        });
      }

      // Convert string dates to Date objects
      const inputs: PaymentDeferralEligibilityInputs = {
        loanOriginationDate: new Date(validation.data.loanOriginationDate),
        evaluationDate: validation.data.evaluationDate ? new Date(validation.data.evaluationDate) : new Date(),
        loanMaturityDate: new Date(validation.data.loanMaturityDate),
        currentDelinquencyMonths: validation.data.currentDelinquencyMonths,
        isDisasterRelated: validation.data.isDisasterRelated,
        priorDeferralHistory: (validation.data.priorDeferralHistory || []).map(item => ({
          ...item,
          effectiveDate: new Date(item.effectiveDate)
        })),
        priorModificationHistory: (validation.data.priorModificationHistory || []).map(item => ({
          ...item,
          effectiveDate: new Date(item.effectiveDate)
        }))
      };

      const result = FinancialCalculatorService.calculatePaymentDeferralEligibilityMetrics(inputs);

      return res.status(200).json({
        calculationType: 'payment_deferral_eligibility',
        ...result
      });
    } catch (error) {
      console.error('Payment deferral eligibility calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate payment deferral eligibility'
        }
      });
    }
  },

  /**
   * Calculate Property LTV and Required Paydown
   */
  async calculatePropertyLTVAndPaydown(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = LTVCalculationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid LTV calculation inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculatePropertyLTVAndPaydown(validation.data);

      return res.status(200).json({
        calculationType: 'property_ltv_and_paydown',
        ...result
      });
    } catch (error) {
      console.error('LTV calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate LTV and paydown'
        }
      });
    }
  },

  /**
   * Calculate Relocation Assistance Eligibility
   */
  async calculateRelocationAssistanceEligibility(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = RelocationAssistanceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid relocation assistance inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateRelocationAssistanceEligibility(validation.data);

      return res.status(200).json({
        calculationType: 'relocation_assistance_eligibility',
        ...result
      });
    } catch (error) {
      console.error('Relocation assistance calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate relocation assistance eligibility'
        }
      });
    }
  },

  /**
   * Calculate Short Sale Net Proceeds and Deficiency
   */
  async calculateShortSaleNetProceeds(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = ShortSaleNetProceedsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid short sale calculation inputs',
            details: validation.error.errors
          }
        });
      }

      const result = FinancialCalculatorService.calculateShortSaleNetProceedsAndDeficiency(validation.data);

      return res.status(200).json({
        calculationType: 'short_sale_net_proceeds_and_deficiency',
        ...result
      });
    } catch (error) {
      console.error('Short sale calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate short sale net proceeds'
        }
      });
    }
  },

  /**
   * Calculate Affordability for Loan Modifications
   */
  async calculateAffordabilityForModification(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = AffordabilitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid affordability calculation inputs',
            details: validation.error.errors
          }
        });
      }

      const {
        grossMonthlyIncome,
        proposedModifiedPITI,
        otherMonthlyDebts,
        targetHousingDTI,
        targetTotalDTI
      } = validation.data;

      const result = FinancialCalculatorService.calculateAffordabilityForModification(
        grossMonthlyIncome,
        proposedModifiedPITI,
        otherMonthlyDebts,
        targetHousingDTI,
        targetTotalDTI
      );

      return res.status(200).json({
        calculationType: 'affordability_for_modification',
        ...result
      });
    } catch (error) {
      console.error('Affordability calculation error:', error);
      return res.status(500).json({
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Failed to calculate affordability for modification'
        }
      });
    }
  },

  /**
   * Comprehensive UBA Form Evaluation
   * 
   * This endpoint takes a UBA form ID and evaluation type, then runs multiple
   * relevant calculations based on the stored form data and extracted documents.
   */
  async evaluateUBAFormForWorkoutOption(req: AuthenticatedRequest, res: Response) {
    try {
      const validation = UBAFormEvaluationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid UBA form evaluation inputs',
            details: validation.error.errors
          }
        });
      }

      const { ubaFormId, evaluationType } = validation.data;

      // Get UBA form data
      const ubaForm = await storage.getUbaFormData(ubaFormId, req.user!.id);
      if (!ubaForm) {
        return res.status(404).json({
          error: {
            code: 'FORM_NOT_FOUND',
            message: 'UBA form not found'
          }
        });
      }

      // Get aggregated document data
      const documentData = await storage.getAggregatedDocumentData(ubaForm.transaction_id);

      // Convert cents to dollars for calculations
      const grossMonthlyIncome = (ubaForm.monthly_gross_income || 0) / 100;
      const monthlyExpenses = (ubaForm.monthly_expenses || 0) / 100;
      const liquidAssets = (ubaForm.liquid_assets || 0) / 100;

      const calculations: Record<string, any> = {};

      // Always calculate basic DTI and cash reserves
      if (grossMonthlyIncome > 0 && monthlyExpenses > 0) {
        calculations.housingDTI = FinancialCalculatorService.calculateHousingExpenseToIncomeRatio({
          monthlyPITI: monthlyExpenses, // Using total expenses as proxy for PITI
          grossMonthlyIncome
        });

        calculations.totalDTI = FinancialCalculatorService.calculateTotalDebtToIncomeRatio({
          monthlyPITI: monthlyExpenses,
          grossMonthlyIncome,
          otherMonthlyDebts: 0 // Would need additional data from documents
        });
      }

      if (liquidAssets > 0) {
        calculations.cashReserves = FinancialCalculatorService.calculateNonRetirementCashReserves({
          checkingAccountBalance: liquidAssets * 0.5, // Estimate split
          savingsAccountBalance: liquidAssets * 0.5,
          moneyMarketBalance: 0,
          stocksBondsValue: 0,
          otherLiquidAssets: 0
        });
      }

      // Evaluation-specific calculations
      switch (evaluationType) {
        case 'short_sale':
        case 'deed_in_lieu':
          if (calculations.cashReserves && calculations.housingDTI) {
            calculations.cashContribution = FinancialCalculatorService.calculateCashContribution({
              nonRetirementCashReserves: calculations.cashReserves.result,
              contractualMonthlyPITI: monthlyExpenses,
              estimatedDeficiency: validation.data.estimatedSalePrice ? 
                Math.max(0, 300000 - validation.data.estimatedSalePrice) : 50000, // Estimate
              housingExpenseToIncomeRatio: calculations.housingDTI.result
            });

            calculations.relocationAssistance = FinancialCalculatorService.calculateRelocationAssistanceEligibility({
              isPrincipalResidence: true, // From form data if available
              isCashContributionRequired: calculations.cashContribution.result.contributionRequired,
              isServicememberWithPCS: false // From form data if available
            });
          }
          break;

        case 'modification':
          if (grossMonthlyIncome > 0) {
            const proposedModifiedPITI = grossMonthlyIncome * 0.31; // Target 31% housing DTI
            calculations.affordability = FinancialCalculatorService.calculateAffordabilityForModification(
              grossMonthlyIncome,
              proposedModifiedPITI,
              0 // Other debts would come from documents
            );

            calculations.trialPeriodPayment = FinancialCalculatorService.calculateTrialPeriodPayment(
              proposedModifiedPITI * 0.8, // Estimate P&I portion
              proposedModifiedPITI * 0.15, // Estimate taxes
              proposedModifiedPITI * 0.05  // Estimate insurance
            );
          }
          break;

        case 'payment_deferral':
          // Would need loan origination date and other historical data
          calculations.paymentDeferralNote = {
            message: 'Payment deferral eligibility requires loan origination date, maturity date, and delinquency history'
          };
          break;
      }

      await storage.logWorkflowEvent({
        user_id: req.user!.id,
        event_type: 'ai_recommendation_generated',
        event_category: 'financial_calculation',
        event_name: 'comprehensive_uba_evaluation',
        event_description: `Evaluated UBA form for ${evaluationType}`,
        success_indicator: true,
        event_metadata: JSON.stringify({
          uba_form_id: ubaFormId,
          evaluation_type: evaluationType,
          calculations_performed: Object.keys(calculations)
        })
      });

      return res.status(200).json({
        evaluationType,
        ubaFormId,
        formData: {
          grossMonthlyIncome,
          monthlyExpenses,
          liquidAssets,
          hardshipType: ubaForm.hardship_type,
          assistanceTypeRequested: ubaForm.assistance_type_requested
        },
        documentData: {
          documentCount: documentData.documentCount,
          extractedFieldsCount: documentData.extractedFields.length
        },
        calculations,
        evaluationTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('UBA form evaluation error:', error);
      return res.status(500).json({
        error: {
          code: 'EVALUATION_ERROR',
          message: 'Failed to evaluate UBA form for workout option'
        }
      });
    }
  },

  /**
   * Get Available Calculators
   */
  async getAvailableCalculators(req: Request, res: Response) {
    try {
      const calculators = FinancialCalculatorService.getAvailableCalculators();

      return res.status(200).json({
        calculators,
        totalCount: calculators.length,
        supportedLoanTypes: ['Conventional', 'FHA', 'VA', 'USDA', 'Other'],
        guidelineReference: 'Fannie Mae Servicing Guide dated April 9, 2025'
      });
    } catch (error) {
      console.error('Get available calculators error:', error);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve available calculators'
        }
      });
    }
  }
};

export default financialCalculatorController;