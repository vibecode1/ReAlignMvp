/**
 * Financial Calculator Dashboard
 * 
 * Comprehensive dashboard for all 13 Fannie Mae financial calculators.
 * Provides organized access to loss mitigation calculations with results display.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calculator, 
  DollarSign, 
  Home, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { financialCalculatorApi, CalculationResult } from '@/lib/financialCalculatorApi';
import { 
  exportCalculationsToPDF, 
  exportCalculationsToExcel, 
  exportCalculationsToJSON, 
  prepareCalculationExport 
} from '@/lib/calculationExport';
import CalculationHistory from './CalculationHistory';

interface CalculatorFormData {
  // DTI Calculations
  monthlyPITI: number;
  grossMonthlyIncome: number;
  otherMonthlyDebts: number;
  loanType: 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'Other';
  
  // Cash Reserves
  checkingAccountBalance: number;
  savingsAccountBalance: number;
  moneyMarketBalance: number;
  stocksBondsValue: number;
  otherLiquidAssets: number;
  
  // Cash Contribution
  estimatedDeficiency: number;
  isCurrentOrLessThan60DaysDelinquent: boolean;
  isServicememberWithPCS: boolean;
  
  // Income Gross-Up
  nonTaxableIncome: number;
  grossUpPercentage: number;
  
  // Escrow Shortage
  escrowShortageAmount: number;
  repaymentTermMonths: number;
  
  // Trial Period Payment
  principalAndInterest: number;
  monthlyPropertyTaxes: number;
  monthlyInsurance: number;
  otherEscrowAmounts: number;
  
  // Repayment Plan
  totalDelinquencyAmount: number;
  proposedRepaymentTermMonths: number;
  
  // LTV Calculation
  currentLoanBalance: number;
  propertyValueBefore: number;
  propertyValueAfter: number;
  targetLTV: number;
  
  // Short Sale
  estimatedSalePrice: number;
  realEstateCommission: number;
  closingCosts: number;
  repairCosts: number;
  subordinateLienPayoffs: number;
  otherCosts: number;
  unpaidPrincipalBalance: number;
  accruedInterest: number;
  otherAdvances: number;
  
  // Relocation Assistance
  isPrincipalResidence: boolean;
  receivingDLAOrGovernmentAid: boolean;
  
  // Affordability
  proposedModifiedPITI: number;
  targetHousingDTI: number;
  targetTotalDTI: number;
  
  // Payment Deferral
  loanOriginationDate: string;
  loanMaturityDate: string;
  currentDelinquencyMonths: number;
  isDisasterRelated: boolean;
}

interface CalculationResults {
  [key: string]: CalculationResult<any> | null;
}

export const FinancialCalculatorDashboard: React.FC = () => {
  const { register, watch, setValue, getValues, formState: { errors } } = useForm<CalculatorFormData>({
    defaultValues: {
      loanType: 'Conventional',
      grossUpPercentage: 25,
      repaymentTermMonths: 60,
      targetLTV: 60,
      targetHousingDTI: 31,
      targetTotalDTI: 43,
      isCurrentOrLessThan60DaysDelinquent: false,
      isServicememberWithPCS: false,
      isPrincipalResidence: true,
      receivingDLAOrGovernmentAid: false,
      isDisasterRelated: false
    }
  });

  const [results, setResults] = useState<CalculationResults>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('dti');

  const watchedValues = watch();

  // Auto-calculate dependent values
  useEffect(() => {
    const { checkingAccountBalance = 0, savingsAccountBalance = 0, moneyMarketBalance = 0, stocksBondsValue = 0, otherLiquidAssets = 0 } = watchedValues;
    const totalCashReserves = checkingAccountBalance + savingsAccountBalance + moneyMarketBalance + stocksBondsValue + otherLiquidAssets;
    
    if (totalCashReserves > 0) {
      calculateCashReserves();
    }
  }, [watchedValues.checkingAccountBalance, watchedValues.savingsAccountBalance, watchedValues.moneyMarketBalance, watchedValues.stocksBondsValue, watchedValues.otherLiquidAssets]);

  const performCalculation = async (calculationType: string, calculationFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [calculationType]: true }));
    try {
      const result = await calculationFn();
      setResults(prev => ({ ...prev, [calculationType]: result }));
    } catch (error) {
      console.error(`${calculationType} calculation error:`, error);
      setResults(prev => ({ ...prev, [calculationType]: null }));
    } finally {
      setLoading(prev => ({ ...prev, [calculationType]: false }));
    }
  };

  const calculateHousingDTI = () => {
    const { monthlyPITI, grossMonthlyIncome, loanType } = getValues();
    if (!monthlyPITI || !grossMonthlyIncome) return;
    
    performCalculation('housingDTI', () =>
      financialCalculatorApi.calculateHousingDTI({
        monthlyPITI,
        grossMonthlyIncome,
        loanType
      })
    );
  };

  const calculateTotalDTI = () => {
    const { monthlyPITI, grossMonthlyIncome, otherMonthlyDebts, loanType } = getValues();
    if (!monthlyPITI || !grossMonthlyIncome) return;
    
    performCalculation('totalDTI', () =>
      financialCalculatorApi.calculateTotalDTI({
        monthlyPITI,
        grossMonthlyIncome,
        otherMonthlyDebts: otherMonthlyDebts || 0,
        loanType
      })
    );
  };

  const calculateCashReserves = () => {
    const { checkingAccountBalance, savingsAccountBalance, moneyMarketBalance, stocksBondsValue, otherLiquidAssets } = getValues();
    
    performCalculation('cashReserves', () =>
      financialCalculatorApi.calculateCashReserves({
        checkingAccountBalance: checkingAccountBalance || 0,
        savingsAccountBalance: savingsAccountBalance || 0,
        moneyMarketBalance: moneyMarketBalance || 0,
        stocksBondsValue: stocksBondsValue || 0,
        otherLiquidAssets: otherLiquidAssets || 0
      })
    );
  };

  const calculateCashContribution = () => {
    const cashReservesResult = results.cashReserves;
    const housingDTIResult = results.housingDTI;
    const { estimatedDeficiency, isCurrentOrLessThan60DaysDelinquent, isServicememberWithPCS, monthlyPITI, loanType } = getValues();
    
    if (!cashReservesResult || !estimatedDeficiency || !monthlyPITI) return;
    
    performCalculation('cashContribution', () =>
      financialCalculatorApi.calculateCashContribution({
        nonRetirementCashReserves: cashReservesResult.result,
        contractualMonthlyPITI: monthlyPITI,
        estimatedDeficiency,
        housingExpenseToIncomeRatio: housingDTIResult?.result,
        isCurrentOrLessThan60DaysDelinquent,
        isServicememberWithPCS,
        loanType
      })
    );
  };

  const calculateIncomeGrossUp = () => {
    const { nonTaxableIncome, grossUpPercentage } = getValues();
    if (!nonTaxableIncome) return;
    
    performCalculation('incomeGrossUp', () =>
      financialCalculatorApi.calculateIncomeGrossUp(nonTaxableIncome, grossUpPercentage / 100)
    );
  };

  const calculateEscrowShortageRepayment = () => {
    const { escrowShortageAmount, repaymentTermMonths } = getValues();
    if (!escrowShortageAmount) return;
    
    performCalculation('escrowShortage', () =>
      financialCalculatorApi.calculateEscrowShortageRepayment(escrowShortageAmount, repaymentTermMonths)
    );
  };

  const calculateTrialPeriodPayment = () => {
    const { principalAndInterest, monthlyPropertyTaxes, monthlyInsurance, otherEscrowAmounts } = getValues();
    if (!principalAndInterest || !monthlyPropertyTaxes || !monthlyInsurance) return;
    
    performCalculation('trialPeriodPayment', () =>
      financialCalculatorApi.calculateTrialPeriodPayment({
        principalAndInterest,
        monthlyPropertyTaxes,
        monthlyInsurance,
        otherEscrowAmounts: otherEscrowAmounts || 0
      })
    );
  };

  const calculateRepaymentPlan = () => {
    const { monthlyPITI, totalDelinquencyAmount, proposedRepaymentTermMonths } = getValues();
    if (!monthlyPITI || !totalDelinquencyAmount || !proposedRepaymentTermMonths) return;
    
    performCalculation('repaymentPlan', () =>
      financialCalculatorApi.calculateRepaymentPlanParameters({
        fullMonthlyPITI: monthlyPITI,
        totalDelinquencyAmount,
        proposedRepaymentTermMonths
      })
    );
  };

  const calculatePropertyLTV = () => {
    const { currentLoanBalance, propertyValueBefore, propertyValueAfter, targetLTV } = getValues();
    if (!currentLoanBalance || !propertyValueBefore) return;
    
    performCalculation('propertyLTV', () =>
      financialCalculatorApi.calculatePropertyLTVAndPaydown({
        currentLoanBalance,
        propertyValueBefore,
        propertyValueAfter: propertyValueAfter || propertyValueBefore,
        targetLTV: targetLTV / 100
      })
    );
  };

  const calculateRelocationAssistance = () => {
    const cashContributionResult = results.cashContribution;
    const { isPrincipalResidence, isServicememberWithPCS, receivingDLAOrGovernmentAid } = getValues();
    
    performCalculation('relocationAssistance', () =>
      financialCalculatorApi.calculateRelocationAssistanceEligibility({
        isPrincipalResidence,
        isCashContributionRequired: cashContributionResult?.result?.contributionRequired || false,
        isServicememberWithPCS,
        receivingDLAOrGovernmentAid
      })
    );
  };

  const calculateShortSaleProceeds = () => {
    const { estimatedSalePrice, realEstateCommission, closingCosts, repairCosts, subordinateLienPayoffs, otherCosts, unpaidPrincipalBalance, accruedInterest, otherAdvances } = getValues();
    if (!estimatedSalePrice || !unpaidPrincipalBalance) return;
    
    performCalculation('shortSaleProceeds', () =>
      financialCalculatorApi.calculateShortSaleNetProceeds({
        estimatedSalePrice,
        sellingCosts: {
          realEstateCommission: realEstateCommission || 0,
          closingCosts: closingCosts || 0,
          repairCosts: repairCosts || 0,
          subordinateLienPayoffs: subordinateLienPayoffs || 0,
          otherCosts: otherCosts || 0
        },
        unpaidPrincipalBalance,
        accruedInterest: accruedInterest || 0,
        otherAdvances: otherAdvances || 0
      })
    );
  };

  const calculateAffordability = () => {
    const { grossMonthlyIncome, proposedModifiedPITI, otherMonthlyDebts, targetHousingDTI, targetTotalDTI } = getValues();
    if (!grossMonthlyIncome || !proposedModifiedPITI) return;
    
    performCalculation('affordability', () =>
      financialCalculatorApi.calculateAffordabilityForModification({
        grossMonthlyIncome,
        proposedModifiedPITI,
        otherMonthlyDebts: otherMonthlyDebts || 0,
        targetHousingDTI: targetHousingDTI / 100,
        targetTotalDTI: targetTotalDTI / 100
      })
    );
  };

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

  const handleExportToPDF = async () => {
    if (Object.keys(results).length === 0) {
      alert('No calculations to export. Please run some calculations first.');
      return;
    }

    try {
      const exportData = prepareCalculationExport(
        Object.fromEntries(
          Object.entries(results).filter(([_, result]) => result !== null)
        ) as Record<string, CalculationResult<any>>,
        {
          calculationType: 'Fannie Mae Loss Mitigation Analysis',
          borrowerName: 'Sample Borrower', // Could be from form data
          propertyAddress: 'Sample Property Address', // Could be from form data
          loanNumber: 'Sample Loan Number' // Could be from form data
        }
      );
      
      await exportCalculationsToPDF(exportData);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportToExcel = () => {
    if (Object.keys(results).length === 0) {
      alert('No calculations to export. Please run some calculations first.');
      return;
    }

    try {
      const exportData = prepareCalculationExport(
        Object.fromEntries(
          Object.entries(results).filter(([_, result]) => result !== null)
        ) as Record<string, CalculationResult<any>>,
        {
          calculationType: 'Fannie Mae Loss Mitigation Analysis',
          borrowerName: 'Sample Borrower',
          propertyAddress: 'Sample Property Address',
          loanNumber: 'Sample Loan Number'
        }
      );
      
      exportCalculationsToExcel(exportData);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const handleExportToJSON = () => {
    if (Object.keys(results).length === 0) {
      alert('No calculations to export. Please run some calculations first.');
      return;
    }

    try {
      const exportData = prepareCalculationExport(
        Object.fromEntries(
          Object.entries(results).filter(([_, result]) => result !== null)
        ) as Record<string, CalculationResult<any>>,
        {
          calculationType: 'Fannie Mae Loss Mitigation Analysis',
          borrowerName: 'Sample Borrower',
          propertyAddress: 'Sample Property Address',
          loanNumber: 'Sample Loan Number'
        }
      );
      
      exportCalculationsToJSON(exportData);
    } catch (error) {
      console.error('JSON export error:', error);
      alert('Failed to export JSON file. Please try again.');
    }
  };

  const ResultDisplay: React.FC<{
    title: string;
    result: CalculationResult<any> | null;
    loading: boolean;
    formatter?: (value: any) => string;
  }> = ({ title, result, loading, formatter = String }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Calculating...</div>
        ) : result ? (
          <div className="space-y-3">
            <div className="text-2xl font-bold text-primary">
              {typeof result.result === 'object' ? 
                Object.entries(result.result).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {formatter(value)}
                  </div>
                )) :
                formatter(result.result)
              }
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {result.guidelineReference && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <Info className="h-3 w-3 inline mr-1" />
                {result.guidelineReference}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground">No calculation performed</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Calculator Dashboard</h1>
          <p className="text-muted-foreground">Fannie Mae Loss Mitigation Calculations</p>
        </div>
        <Badge variant="outline" className="text-sm">
          13 Calculators Available
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dti">DTI & Income</TabsTrigger>
          <TabsTrigger value="cash">Cash & Reserves</TabsTrigger>
          <TabsTrigger value="payments">Payments & Plans</TabsTrigger>
          <TabsTrigger value="property">Property & Sales</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="dti" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Debt-to-Income Calculations
              </CardTitle>
              <CardDescription>
                Calculate housing and total DTI ratios for affordability assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grossMonthlyIncome">Gross Monthly Income</Label>
                  <Input
                    id="grossMonthlyIncome"
                    type="number"
                    step="0.01"
                    {...register('grossMonthlyIncome', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyPITI">Monthly PITI</Label>
                  <Input
                    id="monthlyPITI"
                    type="number"
                    step="0.01"
                    {...register('monthlyPITI', { valueAsNumber: true })}
                    placeholder="2000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="otherMonthlyDebts">Other Monthly Debts</Label>
                  <Input
                    id="otherMonthlyDebts"
                    type="number"
                    step="0.01"
                    {...register('otherMonthlyDebts', { valueAsNumber: true })}
                    placeholder="500.00"
                  />
                </div>
                <div>
                  <Label htmlFor="loanType">Loan Type</Label>
                  <Select value={watchedValues.loanType} onValueChange={(value: any) => setValue('loanType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conventional">Conventional</SelectItem>
                      <SelectItem value="FHA">FHA</SelectItem>
                      <SelectItem value="VA">VA</SelectItem>
                      <SelectItem value="USDA">USDA</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={calculateHousingDTI} disabled={loading.housingDTI}>
                  Calculate Housing DTI
                </Button>
                <Button onClick={calculateTotalDTI} disabled={loading.totalDTI}>
                  Calculate Total DTI
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ResultDisplay 
                  title="Housing DTI (Front-End)" 
                  result={results.housingDTI} 
                  loading={loading.housingDTI}
                  formatter={formatPercentage}
                />
                <ResultDisplay 
                  title="Total DTI (Back-End)" 
                  result={results.totalDTI} 
                  loading={loading.totalDTI}
                  formatter={formatPercentage}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Income Gross-Up Calculator
              </CardTitle>
              <CardDescription>
                Adjust non-taxable income for qualification purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nonTaxableIncome">Non-Taxable Income</Label>
                  <Input
                    id="nonTaxableIncome"
                    type="number"
                    step="0.01"
                    {...register('nonTaxableIncome', { valueAsNumber: true })}
                    placeholder="1000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="grossUpPercentage">Gross-Up Percentage (%)</Label>
                  <Input
                    id="grossUpPercentage"
                    type="number"
                    step="0.01"
                    {...register('grossUpPercentage', { valueAsNumber: true })}
                    placeholder="25.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculateIncomeGrossUp} disabled={loading.incomeGrossUp}>
                Calculate Gross-Up
              </Button>

              <ResultDisplay 
                title="Adjusted Gross Income" 
                result={results.incomeGrossUp} 
                loading={loading.incomeGrossUp}
                formatter={formatCurrency}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash Reserves Calculation
              </CardTitle>
              <CardDescription>
                Calculate total liquid assets excluding retirement funds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkingAccountBalance">Checking Account</Label>
                  <Input
                    id="checkingAccountBalance"
                    type="number"
                    step="0.01"
                    {...register('checkingAccountBalance', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="savingsAccountBalance">Savings Account</Label>
                  <Input
                    id="savingsAccountBalance"
                    type="number"
                    step="0.01"
                    {...register('savingsAccountBalance', { valueAsNumber: true })}
                    placeholder="15000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="moneyMarketBalance">Money Market</Label>
                  <Input
                    id="moneyMarketBalance"
                    type="number"
                    step="0.01"
                    {...register('moneyMarketBalance', { valueAsNumber: true })}
                    placeholder="3000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stocksBondsValue">Stocks & Bonds</Label>
                  <Input
                    id="stocksBondsValue"
                    type="number"
                    step="0.01"
                    {...register('stocksBondsValue', { valueAsNumber: true })}
                    placeholder="7000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="otherLiquidAssets">Other Liquid Assets</Label>
                  <Input
                    id="otherLiquidAssets"
                    type="number"
                    step="0.01"
                    {...register('otherLiquidAssets', { valueAsNumber: true })}
                    placeholder="2000.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculateCashReserves} disabled={loading.cashReserves}>
                Calculate Cash Reserves
              </Button>

              <ResultDisplay 
                title="Total Non-Retirement Cash Reserves" 
                result={results.cashReserves} 
                loading={loading.cashReserves}
                formatter={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cash Contribution Calculator
              </CardTitle>
              <CardDescription>
                Determine required cash contribution for short sales and deed-in-lieu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedDeficiency">Estimated Deficiency</Label>
                  <Input
                    id="estimatedDeficiency"
                    type="number"
                    step="0.01"
                    {...register('estimatedDeficiency', { valueAsNumber: true })}
                    placeholder="50000.00"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isCurrentOrLessThan60DaysDelinquent" 
                      checked={watchedValues.isCurrentOrLessThan60DaysDelinquent}
                      onCheckedChange={(checked) => setValue('isCurrentOrLessThan60DaysDelinquent', !!checked)}
                    />
                    <Label htmlFor="isCurrentOrLessThan60DaysDelinquent">Current or ≤60 Days Delinquent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isServicememberWithPCS" 
                      checked={watchedValues.isServicememberWithPCS}
                      onCheckedChange={(checked) => setValue('isServicememberWithPCS', !!checked)}
                    />
                    <Label htmlFor="isServicememberWithPCS">Servicemember with PCS Orders</Label>
                  </div>
                </div>
              </div>
              
              <Button onClick={calculateCashContribution} disabled={loading.cashContribution || !results.cashReserves}>
                Calculate Cash Contribution
              </Button>

              <ResultDisplay 
                title="Cash Contribution Analysis" 
                result={results.cashContribution} 
                loading={loading.cashContribution}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Escrow Shortage Repayment
              </CardTitle>
              <CardDescription>
                Calculate monthly payment to cure escrow shortage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="escrowShortageAmount">Escrow Shortage Amount</Label>
                  <Input
                    id="escrowShortageAmount"
                    type="number"
                    step="0.01"
                    {...register('escrowShortageAmount', { valueAsNumber: true })}
                    placeholder="6000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="repaymentTermMonths">Repayment Term (Months)</Label>
                  <Input
                    id="repaymentTermMonths"
                    type="number"
                    {...register('repaymentTermMonths', { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>
              </div>
              
              <Button onClick={calculateEscrowShortageRepayment} disabled={loading.escrowShortage}>
                Calculate Monthly Repayment
              </Button>

              <ResultDisplay 
                title="Monthly Escrow Repayment" 
                result={results.escrowShortage} 
                loading={loading.escrowShortage}
                formatter={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Trial Period Payment
              </CardTitle>
              <CardDescription>
                Calculate total PITI for loan modification trial period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="principalAndInterest">Principal & Interest</Label>
                  <Input
                    id="principalAndInterest"
                    type="number"
                    step="0.01"
                    {...register('principalAndInterest', { valueAsNumber: true })}
                    placeholder="1500.00"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyPropertyTaxes">Monthly Property Taxes</Label>
                  <Input
                    id="monthlyPropertyTaxes"
                    type="number"
                    step="0.01"
                    {...register('monthlyPropertyTaxes', { valueAsNumber: true })}
                    placeholder="400.00"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyInsurance">Monthly Insurance</Label>
                  <Input
                    id="monthlyInsurance"
                    type="number"
                    step="0.01"
                    {...register('monthlyInsurance', { valueAsNumber: true })}
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <Label htmlFor="otherEscrowAmounts">Other Escrow (HOA, etc.)</Label>
                  <Input
                    id="otherEscrowAmounts"
                    type="number"
                    step="0.01"
                    {...register('otherEscrowAmounts', { valueAsNumber: true })}
                    placeholder="50.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculateTrialPeriodPayment} disabled={loading.trialPeriodPayment}>
                Calculate Trial Payment
              </Button>

              <ResultDisplay 
                title="Total Trial Period Payment" 
                result={results.trialPeriodPayment} 
                loading={loading.trialPeriodPayment}
                formatter={formatCurrency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Repayment Plan Parameters
              </CardTitle>
              <CardDescription>
                Validate repayment plan compliance with Fannie Mae guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalDelinquencyAmount">Total Delinquency Amount</Label>
                  <Input
                    id="totalDelinquencyAmount"
                    type="number"
                    step="0.01"
                    {...register('totalDelinquencyAmount', { valueAsNumber: true })}
                    placeholder="6000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="proposedRepaymentTermMonths">Proposed Term (Months)</Label>
                  <Input
                    id="proposedRepaymentTermMonths"
                    type="number"
                    {...register('proposedRepaymentTermMonths', { valueAsNumber: true })}
                    placeholder="12"
                  />
                </div>
              </div>
              
              <Button onClick={calculateRepaymentPlan} disabled={loading.repaymentPlan}>
                Validate Repayment Plan
              </Button>

              <ResultDisplay 
                title="Repayment Plan Analysis" 
                result={results.repaymentPlan} 
                loading={loading.repaymentPlan}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Affordability Assessment
              </CardTitle>
              <CardDescription>
                Evaluate proposed modification affordability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposedModifiedPITI">Proposed Modified PITI</Label>
                  <Input
                    id="proposedModifiedPITI"
                    type="number"
                    step="0.01"
                    {...register('proposedModifiedPITI', { valueAsNumber: true })}
                    placeholder="1800.00"
                  />
                </div>
                <div>
                  <Label htmlFor="targetHousingDTI">Target Housing DTI (%)</Label>
                  <Input
                    id="targetHousingDTI"
                    type="number"
                    step="0.01"
                    {...register('targetHousingDTI', { valueAsNumber: true })}
                    placeholder="31.00"
                  />
                </div>
                <div>
                  <Label htmlFor="targetTotalDTI">Target Total DTI (%)</Label>
                  <Input
                    id="targetTotalDTI"
                    type="number"
                    step="0.01"
                    {...register('targetTotalDTI', { valueAsNumber: true })}
                    placeholder="43.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculateAffordability} disabled={loading.affordability}>
                Assess Affordability
              </Button>

              <ResultDisplay 
                title="Affordability Analysis" 
                result={results.affordability} 
                loading={loading.affordability}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property LTV & Paydown
              </CardTitle>
              <CardDescription>
                Calculate loan-to-value ratio and required paydown amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLoanBalance">Current Loan Balance</Label>
                  <Input
                    id="currentLoanBalance"
                    type="number"
                    step="0.01"
                    {...register('currentLoanBalance', { valueAsNumber: true })}
                    placeholder="300000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyValueBefore">Property Value (Before)</Label>
                  <Input
                    id="propertyValueBefore"
                    type="number"
                    step="0.01"
                    {...register('propertyValueBefore', { valueAsNumber: true })}
                    placeholder="400000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="propertyValueAfter">Property Value (After)</Label>
                  <Input
                    id="propertyValueAfter"
                    type="number"
                    step="0.01"
                    {...register('propertyValueAfter', { valueAsNumber: true })}
                    placeholder="350000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="targetLTV">Target LTV (%)</Label>
                  <Input
                    id="targetLTV"
                    type="number"
                    step="0.01"
                    {...register('targetLTV', { valueAsNumber: true })}
                    placeholder="60.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculatePropertyLTV} disabled={loading.propertyLTV}>
                Calculate LTV & Paydown
              </Button>

              <ResultDisplay 
                title="LTV & Paydown Analysis" 
                result={results.propertyLTV} 
                loading={loading.propertyLTV}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Short Sale Net Proceeds
              </CardTitle>
              <CardDescription>
                Calculate net proceeds and deficiency for short sale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedSalePrice">Estimated Sale Price</Label>
                  <Input
                    id="estimatedSalePrice"
                    type="number"
                    step="0.01"
                    {...register('estimatedSalePrice', { valueAsNumber: true })}
                    placeholder="300000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="unpaidPrincipalBalance">Unpaid Principal Balance</Label>
                  <Input
                    id="unpaidPrincipalBalance"
                    type="number"
                    step="0.01"
                    {...register('unpaidPrincipalBalance', { valueAsNumber: true })}
                    placeholder="320000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="realEstateCommission">Real Estate Commission</Label>
                  <Input
                    id="realEstateCommission"
                    type="number"
                    step="0.01"
                    {...register('realEstateCommission', { valueAsNumber: true })}
                    placeholder="18000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="closingCosts">Closing Costs</Label>
                  <Input
                    id="closingCosts"
                    type="number"
                    step="0.01"
                    {...register('closingCosts', { valueAsNumber: true })}
                    placeholder="3000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="repairCosts">Repair Costs</Label>
                  <Input
                    id="repairCosts"
                    type="number"
                    step="0.01"
                    {...register('repairCosts', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                </div>
                <div>
                  <Label htmlFor="accruedInterest">Accrued Interest</Label>
                  <Input
                    id="accruedInterest"
                    type="number"
                    step="0.01"
                    {...register('accruedInterest', { valueAsNumber: true })}
                    placeholder="5000.00"
                  />
                </div>
              </div>
              
              <Button onClick={calculateShortSaleProceeds} disabled={loading.shortSaleProceeds}>
                Calculate Net Proceeds
              </Button>

              <ResultDisplay 
                title="Short Sale Analysis" 
                result={results.shortSaleProceeds} 
                loading={loading.shortSaleProceeds}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Relocation Assistance
              </CardTitle>
              <CardDescription>
                Determine eligibility for $7,500 relocation assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isPrincipalResidence" 
                    checked={watchedValues.isPrincipalResidence}
                    onCheckedChange={(checked) => setValue('isPrincipalResidence', !!checked)}
                  />
                  <Label htmlFor="isPrincipalResidence">Principal Residence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="receivingDLAOrGovernmentAid" 
                    checked={watchedValues.receivingDLAOrGovernmentAid}
                    onCheckedChange={(checked) => setValue('receivingDLAOrGovernmentAid', !!checked)}
                  />
                  <Label htmlFor="receivingDLAOrGovernmentAid">Receiving DLA or Government Aid</Label>
                </div>
              </div>
              
              <Button onClick={calculateRelocationAssistance} disabled={loading.relocationAssistance}>
                Check Eligibility
              </Button>

              <ResultDisplay 
                title="Relocation Assistance Eligibility" 
                result={results.relocationAssistance} 
                loading={loading.relocationAssistance}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <CalculationHistory 
            currentCalculations={Object.fromEntries(
              Object.entries(results).filter(([_, result]) => result !== null)
            ) as Record<string, CalculationResult<any>>}
            onLoadCalculation={(calculation) => {
              // Load the saved calculations into the current results
              setResults(calculation.calculations);
              // Could also populate form fields if metadata is available
              if (calculation.metadata.borrowerName) {
                // Set borrower name in form
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Results
          </CardTitle>
          <CardDescription>
            Export calculation results for documentation and review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportToPDF}
              disabled={Object.keys(results).length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportToExcel}
              disabled={Object.keys(results).length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportToJSON}
              disabled={Object.keys(results).length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to JSON
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {Object.keys(results).length > 0 
              ? `${Object.keys(results).length} calculation(s) ready for export`
              : 'Run calculations to enable export functionality'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCalculatorDashboard;