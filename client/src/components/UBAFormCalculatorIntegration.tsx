/**
 * UBA Form Calculator Integration
 * 
 * Component that automatically populates financial calculators with data from UBA forms.
 * Provides seamless integration between form data and calculation workflows.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { financialCalculatorApi } from '@/lib/financialCalculatorApi';

interface UBAFormData {
  id: string;
  transaction_id: string;
  borrower_name?: string;
  property_address?: string;
  loan_number?: string;
  loan_type?: 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Other';
  monthly_gross_income?: number; // in cents
  monthly_expenses?: number; // in cents
  liquid_assets?: number; // in cents
  total_debt?: number; // in cents
  hardship_type?: string;
  assistance_type_requested?: string[];
}

interface CalculationSuite {
  housingDTI?: any;
  totalDTI?: any;
  cashReserves?: any;
  cashContribution?: any;
  affordability?: any;
  shortSaleProceeds?: any;
  relocationAssistance?: any;
}

interface UBAFormCalculatorIntegrationProps {
  ubaFormData: UBAFormData;
  onCalculationsComplete?: (calculations: CalculationSuite) => void;
}

export const UBAFormCalculatorIntegration: React.FC<UBAFormCalculatorIntegrationProps> = ({
  ubaFormData,
  onCalculationsComplete
}) => {
  const [evaluationType, setEvaluationType] = useState<'short_sale' | 'deed_in_lieu' | 'modification' | 'payment_deferral'>('modification');
  const [calculations, setCalculations] = useState<CalculationSuite>({});
  const [loading, setLoading] = useState(false);
  const [autoCalculationResults, setAutoCalculationResults] = useState<any>(null);

  // Convert cents to dollars for display and calculations
  const grossMonthlyIncome = (ubaFormData.monthly_gross_income || 0) / 100;
  const monthlyExpenses = (ubaFormData.monthly_expenses || 0) / 100;
  const liquidAssets = (ubaFormData.liquid_assets || 0) / 100;
  const totalDebt = (ubaFormData.total_debt || 0) / 100;

  const runComprehensiveEvaluation = async () => {
    if (!ubaFormData.id) return;
    
    setLoading(true);
    try {
      // Use the comprehensive UBA form evaluation endpoint
      const evaluation = await financialCalculatorApi.evaluateUBAFormForWorkoutOption({
        ubaFormId: ubaFormData.id,
        evaluationType,
        propertyValue: 400000, // Could be extracted from documents or user input
        estimatedSalePrice: evaluationType === 'short_sale' ? 350000 : undefined,
        sellingCosts: evaluationType === 'short_sale' ? {
          realEstateCommission: 21000,
          closingCosts: 3000,
          repairCosts: 5000,
          subordinateLienPayoffs: 0,
          otherCosts: 1000
        } : undefined
      });

      setAutoCalculationResults(evaluation);
      
      if (onCalculationsComplete) {
        onCalculationsComplete(evaluation.calculations);
      }
    } catch (error) {
      console.error('Comprehensive evaluation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runIndividualCalculations = async () => {
    setLoading(true);
    const newCalculations: CalculationSuite = {};

    try {
      // Basic DTI calculations if we have income and expenses
      if (grossMonthlyIncome > 0 && monthlyExpenses > 0) {
        try {
          newCalculations.housingDTI = await financialCalculatorApi.calculateHousingDTI({
            monthlyPITI: monthlyExpenses,
            grossMonthlyIncome,
            loanType: ubaFormData.loan_type || 'Conventional'
          });

          newCalculations.totalDTI = await financialCalculatorApi.calculateTotalDTI({
            monthlyPITI: monthlyExpenses,
            grossMonthlyIncome,
            otherMonthlyDebts: Math.max(0, totalDebt - monthlyExpenses), // Estimate other debts
            loanType: ubaFormData.loan_type || 'Conventional'
          });
        } catch (error) {
          console.error('DTI calculation error:', error);
        }
      }

      // Cash reserves calculation if we have liquid assets
      if (liquidAssets > 0) {
        try {
          newCalculations.cashReserves = await financialCalculatorApi.calculateCashReserves({
            checkingAccountBalance: liquidAssets * 0.4, // Estimate distribution
            savingsAccountBalance: liquidAssets * 0.6,
            moneyMarketBalance: 0,
            stocksBondsValue: 0,
            otherLiquidAssets: 0
          });
        } catch (error) {
          console.error('Cash reserves calculation error:', error);
        }
      }

      // Cash contribution calculation for short sales/DIL
      if ((evaluationType === 'short_sale' || evaluationType === 'deed_in_lieu') && 
          newCalculations.cashReserves && newCalculations.housingDTI) {
        try {
          newCalculations.cashContribution = await financialCalculatorApi.calculateCashContribution({
            nonRetirementCashReserves: newCalculations.cashReserves.result,
            contractualMonthlyPITI: monthlyExpenses,
            estimatedDeficiency: 50000, // Estimate - could be calculated from property value
            housingExpenseToIncomeRatio: newCalculations.housingDTI.result,
            loanType: ubaFormData.loan_type || 'Conventional'
          });
        } catch (error) {
          console.error('Cash contribution calculation error:', error);
        }
      }

      // Affordability calculation for modifications
      if (evaluationType === 'modification' && grossMonthlyIncome > 0) {
        try {
          const proposedModifiedPITI = grossMonthlyIncome * 0.31; // Target 31% housing DTI
          newCalculations.affordability = await financialCalculatorApi.calculateAffordabilityForModification({
            grossMonthlyIncome,
            proposedModifiedPITI,
            otherMonthlyDebts: Math.max(0, totalDebt - monthlyExpenses)
          });
        } catch (error) {
          console.error('Affordability calculation error:', error);
        }
      }

      // Relocation assistance calculation
      if (newCalculations.cashContribution) {
        try {
          newCalculations.relocationAssistance = await financialCalculatorApi.calculateRelocationAssistanceEligibility({
            isPrincipalResidence: true, // Assume principal residence - could be from form
            isCashContributionRequired: newCalculations.cashContribution.result.contributionRequired,
            isServicememberWithPCS: false // Could be determined from hardship type
          });
        } catch (error) {
          console.error('Relocation assistance calculation error:', error);
        }
      }

      setCalculations(newCalculations);
      
      if (onCalculationsComplete) {
        onCalculationsComplete(newCalculations);
      }
    } catch (error) {
      console.error('Individual calculations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run calculations when form data changes
  useEffect(() => {
    if (ubaFormData.id && grossMonthlyIncome > 0) {
      runIndividualCalculations();
    }
  }, [ubaFormData.id, evaluationType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (ratio: number) => {
    return `${(ratio * 100).toFixed(2)}%`;
  };

  const getEvaluationDescription = () => {
    switch (evaluationType) {
      case 'short_sale': return 'Short sale with cash contribution and relocation assistance analysis';
      case 'deed_in_lieu': return 'Deed-in-lieu with cash contribution requirements';
      case 'modification': return 'Loan modification affordability assessment';
      case 'payment_deferral': return 'Payment deferral eligibility evaluation';
      default: return 'Comprehensive loss mitigation analysis';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            UBA Form Financial Analysis
          </CardTitle>
          <CardDescription>
            Automated calculations based on {ubaFormData.borrower_name || 'borrower'} financial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Income</div>
              <div className="font-semibold">{formatCurrency(grossMonthlyIncome)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Monthly Expenses</div>
              <div className="font-semibold">{formatCurrency(monthlyExpenses)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Liquid Assets</div>
              <div className="font-semibold">{formatCurrency(liquidAssets)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Loan Type</div>
              <div className="font-semibold">{ubaFormData.loan_type || 'Conventional'}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Evaluation Type</label>
              <Select value={evaluationType} onValueChange={(value: any) => setEvaluationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modification">Loan Modification</SelectItem>
                  <SelectItem value="short_sale">Short Sale</SelectItem>
                  <SelectItem value="deed_in_lieu">Deed-in-Lieu</SelectItem>
                  <SelectItem value="payment_deferral">Payment Deferral</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground mt-1">
                {getEvaluationDescription()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={runIndividualCalculations} disabled={loading} variant="outline">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Run Calculations
              </Button>
              <Button onClick={runComprehensiveEvaluation} disabled={loading || !ubaFormData.id}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Full Evaluation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Calculation Results */}
      {Object.keys(calculations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Individual Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dti" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dti">DTI Analysis</TabsTrigger>
                <TabsTrigger value="cash">Cash Analysis</TabsTrigger>
                <TabsTrigger value="affordability">Affordability</TabsTrigger>
                <TabsTrigger value="assistance">Assistance</TabsTrigger>
              </TabsList>

              <TabsContent value="dti" className="space-y-4">
                {calculations.housingDTI && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Housing DTI (Front-End)</h4>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatPercentage(calculations.housingDTI.result)}
                    </div>
                    {calculations.housingDTI.warnings?.map((warning: string, index: number) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
                
                {calculations.totalDTI && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Total DTI (Back-End)</h4>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatPercentage(calculations.totalDTI.result)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total monthly debt obligations: {formatCurrency(calculations.totalDTI.details?.totalMonthlyDebts || 0)}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cash" className="space-y-4">
                {calculations.cashReserves && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Cash Reserves</h4>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatCurrency(calculations.cashReserves.result)}
                    </div>
                    {calculations.cashReserves.warnings?.map((warning: string, index: number) => (
                      <Alert key={index}>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {calculations.cashContribution && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Cash Contribution Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Contribution Required:</span>
                        <Badge variant={calculations.cashContribution.result.contributionRequired ? 'destructive' : 'secondary'}>
                          {calculations.cashContribution.result.contributionRequired ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {calculations.cashContribution.result.contributionRequired && (
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-bold">{formatCurrency(calculations.cashContribution.result.contributionAmount)}</span>
                        </div>
                      )}
                      {calculations.cashContribution.result.contributionWaived && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>{calculations.cashContribution.result.waiverReason}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="affordability" className="space-y-4">
                {calculations.affordability && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Modification Affordability</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Housing DTI</div>
                        <div className="text-xl font-bold">
                          {formatPercentage(calculations.affordability.result.housingDTI / 100)}
                        </div>
                        <Badge variant={calculations.affordability.result.isAffordableHousing ? 'secondary' : 'destructive'}>
                          {calculations.affordability.result.isAffordableHousing ? 'Affordable' : 'Too High'}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total DTI</div>
                        <div className="text-xl font-bold">
                          {formatPercentage(calculations.affordability.result.totalDTI / 100)}
                        </div>
                        <Badge variant={calculations.affordability.result.isAffordableTotal ? 'secondary' : 'destructive'}>
                          {calculations.affordability.result.isAffordableTotal ? 'Affordable' : 'Too High'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Recommended max PITI: {formatCurrency(calculations.affordability.result.recommendedMaxPITI)}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assistance" className="space-y-4">
                {calculations.relocationAssistance && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Relocation Assistance</h4>
                    <div className="flex items-center justify-between">
                      <span>Eligibility:</span>
                      <Badge variant={calculations.relocationAssistance.result.eligible ? 'secondary' : 'destructive'}>
                        {calculations.relocationAssistance.result.eligible ? 'Eligible' : 'Not Eligible'}
                      </Badge>
                    </div>
                    {calculations.relocationAssistance.result.eligible ? (
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculations.relocationAssistance.result.amount)}
                        </div>
                      </div>
                    ) : (
                      <Alert className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {calculations.relocationAssistance.result.ineligibilityReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Evaluation Results */}
      {autoCalculationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprehensive Evaluation Results
            </CardTitle>
            <CardDescription>
              {evaluationType.replace('_', ' ').toUpperCase()} evaluation completed at {new Date(autoCalculationResults.evaluationTimestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Documents Processed</div>
                  <div className="font-semibold">{autoCalculationResults.documentData?.documentCount || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Data Fields Extracted</div>
                  <div className="font-semibold">{autoCalculationResults.documentData?.extractedFieldsCount || 0}</div>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Calculations Performed:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(autoCalculationResults.calculations || {}).map((calc) => (
                    <Badge key={calc} variant="outline">{calc}</Badge>
                  ))}
                </div>
              </div>

              {autoCalculationResults.calculations && Object.keys(autoCalculationResults.calculations).length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Evaluation complete. Review individual calculation results above for detailed analysis.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UBAFormCalculatorIntegration;