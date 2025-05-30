import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Calculator, 
  FileText, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  Bot,
  DollarSign,
  Home,
  Calendar,
  User
} from 'lucide-react';
import { Link } from 'wouter';
import FinancialCalculatorDashboard from '@/components/FinancialCalculatorDashboard';

interface MakerToolPageProps {
  tool: string;
  subTool?: string;
}

export const MakerToolPage: React.FC<MakerToolPageProps> = ({ tool, subTool }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [calculations, setCalculations] = useState<any>(null);
  const [aiHelp, setAiHelp] = useState<string>('');

  const onSubmit = (data: any) => {
    // Handle form submission
    console.log('Form data:', data);
    
    // Perform calculations based on tool type
    if (tool === 'calculator') {
      performCalculations(data);
    }
  };

  const performCalculations = (data: any) => {
    switch (subTool) {
      case 'dti':
        const frontEndDTI = (parseFloat(data.housingPayment) / parseFloat(data.grossIncome)) * 100;
        const backEndDTI = (parseFloat(data.totalDebts) / parseFloat(data.grossIncome)) * 100;
        setCalculations({
          frontEndDTI: frontEndDTI.toFixed(2),
          backEndDTI: backEndDTI.toFixed(2),
          recommendation: backEndDTI > 43 ? 'High DTI - Consider debt reduction' : 'DTI within acceptable range'
        });
        break;
      case 'insolvency':
        const netWorth = parseFloat(data.totalAssets) - parseFloat(data.totalLiabilities);
        setCalculations({
          netWorth: netWorth.toFixed(2),
          isInsolvent: netWorth < 0,
          recommendation: netWorth < 0 ? 'Borrower is insolvent' : 'Borrower is solvent'
        });
        break;
      case 'net-proceeds':
        const salePrice = parseFloat(data.offerPrice);
        const totalCosts = parseFloat(data.closingCosts) + parseFloat(data.commissions) + parseFloat(data.liens);
        const netProceeds = salePrice - totalCosts;
        setCalculations({
          salePrice: salePrice.toFixed(2),
          totalCosts: totalCosts.toFixed(2),
          netProceeds: netProceeds.toFixed(2),
          shortage: netProceeds < 0 ? Math.abs(netProceeds).toFixed(2) : '0.00'
        });
        break;
    }
  };

  const getAIHelp = (fieldName: string) => {
    const helpTexts: { [key: string]: string } = {
      grossIncome: 'Enter your total monthly gross income before taxes and deductions.',
      housingPayment: 'Include principal, interest, taxes, insurance, and HOA fees.',
      totalDebts: 'Include all monthly debt payments: credit cards, loans, etc.',
      totalAssets: 'Include cash, investments, real estate equity, and other valuable assets.',
      totalLiabilities: 'Include all debts: mortgages, credit cards, loans, etc.',
      offerPrice: 'The accepted purchase offer amount for the property.',
      closingCosts: 'Estimated closing costs including title, escrow, and fees.'
    };
    
    setAiHelp(helpTexts[fieldName] || 'Click the help icon next to any field for guidance.');
  };

  const renderTool = () => {
    switch (tool) {
      case 'checklist':
        return renderChecklistGenerator();
      case 'form':
        return renderFormMaker();
      case 'draft':
        return renderDocumentDrafter();
      case 'calculator':
        return renderCalculator();
      case 'package':
        return renderPackageCenter();
      case 'vault':
        return renderDocumentVault();
      default:
        return <div>Tool not found</div>;
    }
  };

  const renderChecklistGenerator = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Document Checklist Generator
          </CardTitle>
          <CardDescription>
            Answer a few questions to generate a personalized document checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employment Type</Label>
                <Select onValueChange={(value) => setValue('employmentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w2">W-2 Employee</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Hardship Type</Label>
                <Select onValueChange={(value) => setValue('hardshipType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hardship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job-loss">Job Loss</SelectItem>
                    <SelectItem value="medical">Medical Bills</SelectItem>
                    <SelectItem value="divorce">Divorce</SelectItem>
                    <SelectItem value="death">Death in Family</SelectItem>
                    <SelectItem value="business-failure">Business Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Loan Type</Label>
                <Select onValueChange={(value) => setValue('loanType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="fha">FHA</SelectItem>
                    <SelectItem value="va">VA</SelectItem>
                    <SelectItem value="usda">USDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Desired Outcome</Label>
                <Select onValueChange={(value) => setValue('outcome', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select desired outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-sale">Short Sale</SelectItem>
                    <SelectItem value="loan-mod">Loan Modification</SelectItem>
                    <SelectItem value="deed-in-lieu">Deed in Lieu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" className="w-full">
              Generate Checklist
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderFormMaker = () => {
    switch (subTool) {
      case '4506c':
        return (
          <Card>
            <CardHeader>
              <CardTitle>IRS Form 4506-C Maker</CardTitle>
              <CardDescription>Request for Tax Return Information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Taxpayer Name</Label>
                    <Input {...register('taxpayerName', { required: true })} />
                  </div>
                  <div>
                    <Label>Social Security Number</Label>
                    <Input {...register('ssn', { required: true })} placeholder="XXX-XX-XXXX" />
                  </div>
                  <div>
                    <Label>Current Address</Label>
                    <Input {...register('address', { required: true })} />
                  </div>
                  <div>
                    <Label>Tax Year</Label>
                    <Select onValueChange={(value) => setValue('taxYear', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit">Generate Form 4506-C</Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'bfs':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Borrower Financial Statement</CardTitle>
              <CardDescription>Comprehensive financial intake form</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input {...register('fullName', { required: true })} />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" {...register('dateOfBirth', { required: true })} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Monthly Income</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Employment Income</Label>
                      <Input type="number" {...register('employmentIncome')} />
                    </div>
                    <div>
                      <Label>Other Income</Label>
                      <Input type="number" {...register('otherIncome')} />
                    </div>
                  </div>
                </div>
                
                <Button type="submit">Generate Financial Statement</Button>
              </form>
            </CardContent>
          </Card>
        );
      default:
        return <div>Form maker not found</div>;
    }
  };

  const renderCalculator = () => {
    // If no subTool specified, show comprehensive dashboard
    if (!subTool) {
      return <FinancialCalculatorDashboard />;
    }

    switch (subTool) {
      case 'dti':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  DTI Calculator
                </CardTitle>
                <CardDescription>
                  Calculate debt-to-income ratios for loan qualification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center">
                        Gross Monthly Income
                        <HelpCircle 
                          className="ml-1 h-4 w-4 cursor-pointer" 
                          onClick={() => getAIHelp('grossIncome')}
                        />
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...register('grossIncome', { required: true })} 
                        placeholder="5000.00"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center">
                        Total Housing Payment
                        <HelpCircle 
                          className="ml-1 h-4 w-4 cursor-pointer" 
                          onClick={() => getAIHelp('housingPayment')}
                        />
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...register('housingPayment', { required: true })} 
                        placeholder="1500.00"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center">
                        Total Monthly Debts
                        <HelpCircle 
                          className="ml-1 h-4 w-4 cursor-pointer" 
                          onClick={() => getAIHelp('totalDebts')}
                        />
                      </Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...register('totalDebts', { required: true })} 
                        placeholder="800.00"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Calculate DTI
                  </Button>
                </form>

                {calculations && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-3">DTI Calculation Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Front-End DTI</p>
                        <p className="text-2xl font-bold">{calculations.frontEndDTI}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Back-End DTI</p>
                        <p className="text-2xl font-bold">{calculations.backEndDTI}%</p>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{calculations.recommendation}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {aiHelp && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Bot className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">AI Assistant</h4>
                      <p className="text-sm text-muted-foreground">{aiHelp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'insolvency':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Insolvency Calculator</CardTitle>
              <CardDescription>Determine net worth and insolvency status</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Total Assets</Label>
                    <Input type="number" step="0.01" {...register('totalAssets', { required: true })} />
                  </div>
                  <div>
                    <Label>Total Liabilities</Label>
                    <Input type="number" step="0.01" {...register('totalLiabilities', { required: true })} />
                  </div>
                </div>
                <Button type="submit">Calculate Net Worth</Button>
                
                {calculations && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">Net Worth: ${calculations.netWorth}</h3>
                    <p className="text-sm text-muted-foreground">{calculations.recommendation}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        );
      default:
        return <div>Calculator not found</div>;
    }
  };

  const renderDocumentDrafter = () => (
    <Card>
      <CardHeader>
        <CardTitle>Document Drafter</CardTitle>
        <CardDescription>Generate professional documents with guided templates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document Drafter Coming Soon</h3>
          <p className="text-muted-foreground">
            Professional document templates and AI-assisted drafting will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderPackageCenter = () => (
    <Card>
      <CardHeader>
        <CardTitle>Document Package Center</CardTitle>
        <CardDescription>Organize and package documents for submission</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Download className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Package Center Coming Soon</h3>
          <p className="text-muted-foreground">
            Document packaging and organization tools will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentVault = () => (
    <Card>
      <CardHeader>
        <CardTitle>Document Vault</CardTitle>
        <CardDescription>Secure storage for all your generated documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Document Vault Coming Soon</h3>
          <p className="text-muted-foreground">
            Secure document storage and management will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/app/maker">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maker
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {tool} {subTool && `- ${subTool.replace('-', ' ')}`}
            </h1>
            <p className="text-muted-foreground">
              Professional tools for loss mitigation document creation
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Tool Content */}
      {renderTool()}
    </div>
  );
};