import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Printer,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Bot,
  Info,
  XCircle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DocumentChecklistGeneratorProps {
  transactionId: string;
  ubaFormData?: Record<string, any>;
  onDocumentUpload?: (documentId: string) => void;
}

interface ChecklistItem {
  id: string;
  document_name: string;
  category: string;
  priority: 'required' | 'conditional' | 'optional';
  status: 'not_started' | 'uploaded' | 'ai_verified' | 'expert_approved' | 'rejected' | 'needs_attention';
  progress_percentage: number;
  due_date?: string;
  notes?: string;
  ai_confidence_score?: number;
  uploaded_document_id?: string;
  rejection_reason?: string;
}

interface DocumentChecklist {
  id: string;
  transaction_id: string;
  lender_name: string;
  case_type: string;
  property_type: string;
  items: ChecklistItem[];
  total_required: number;
  total_completed: number;
  overall_progress: number;
  ai_guidance?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  income_verification: '💰',
  hardship_documentation: '📋',
  property_information: '🏠',
  financial_statements: '💳',
  legal_documents: '⚖️',
  identity_verification: '🆔',
  bankruptcy_documents: '📑',
  military_documents: '🎖️',
  business_documents: '💼',
  other: '📄'
};

const statusColors = {
  not_started: 'bg-gray-100 text-gray-700',
  uploaded: 'bg-blue-100 text-blue-700',
  ai_verified: 'bg-green-100 text-green-700',
  expert_approved: 'bg-green-500 text-white',
  rejected: 'bg-red-100 text-red-700',
  needs_attention: 'bg-yellow-100 text-yellow-700'
};

const statusIcons = {
  not_started: <Clock className="w-4 h-4" />,
  uploaded: <Upload className="w-4 h-4" />,
  ai_verified: <Bot className="w-4 h-4" />,
  expert_approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  needs_attention: <AlertCircle className="w-4 h-4" />
};

export const DocumentChecklistGenerator: React.FC<DocumentChecklistGeneratorProps> = ({
  transactionId,
  ubaFormData,
  onDocumentUpload
}) => {
  const { toast } = useToast();
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['income_verification']));
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Form state for checklist generation
  const [formData, setFormData] = useState({
    lender_name: '',
    case_type: '',
    property_type: '',
    employment_status: '',
    hardship_type: '',
    delinquency_status: '',
    bankruptcy_status: 'none',
    military_status: 'none',
    has_rental_income: false,
    has_coborrower: false
  });

  // Fetch available lenders
  const { data: lenders } = useQuery({
    queryKey: ['lenders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/checklists/lenders');
      return response.json();
    }
  });

  // Fetch existing checklist
  const { data: checklist, isLoading, refetch } = useQuery({
    queryKey: ['document-checklist', transactionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/v1/transactions/${transactionId}/checklist`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch checklist');
      }
      return response.json();
    }
  });

  // Generate checklist mutation
  const generateChecklist = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/v1/checklists/generate', {
        transaction_id: transactionId,
        ...data,
        uba_form_data: ubaFormData
      });
      if (!response.ok) throw new Error('Failed to generate checklist');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checklist Generated",
        description: `${data.checklist.items.length} documents identified for your ${data.checklist.case_type.replace('_', ' ')}.`,
      });
      setShowGenerator(false);
      refetch();
    }
  });

  // Update checklist item mutation
  const updateChecklistItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/v1/checklists/items/${itemId}`, updates);
      if (!response.ok) throw new Error('Failed to update checklist item');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Pre-fill form data from UBA form if available
  useEffect(() => {
    if (ubaFormData) {
      setFormData(prev => ({
        ...prev,
        case_type: ubaFormData.intent === 'Sell' ? 'short_sale' : 'loan_modification',
        property_type: ubaFormData.property_type === 'My Primary Residence' 
          ? 'primary_residence' 
          : ubaFormData.property_type?.toLowerCase().replace(' ', '_') || prev.property_type,
        employment_status: ubaFormData.employer_name ? 'w2_employed' : 
          ubaFormData.self_employment_income ? 'self_employed' : 
          ubaFormData.unemployment_income ? 'unemployed' : 
          ubaFormData.social_security_income ? 'retired' : prev.employment_status,
        hardship_type: ubaFormData.hardship_type || prev.hardship_type,
        bankruptcy_status: ubaFormData.bankruptcy_filed === 'Yes' ? 'chapter_7' : 'none',
        military_status: ubaFormData.military_service === 'Yes' ? 'active_duty' : 'none',
        has_rental_income: parseFloat(ubaFormData.rental_income || '0') > 0,
        has_coborrower: ubaFormData.has_coborrower === 'Yes'
      }));
    }
  }, [ubaFormData]);

  const handleGenerateChecklist = () => {
    if (!formData.lender_name || !formData.case_type || !formData.property_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    generateChecklist.mutate(formData);
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    // This would integrate with your existing file upload system
    // For now, we'll just update the status
    updateChecklistItem.mutate({
      itemId,
      updates: {
        status: 'uploaded',
        uploaded_document_id: 'temp-id' // Replace with actual upload
      }
    });

    if (onDocumentUpload) {
      onDocumentUpload('temp-id');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getFilteredItems = () => {
    if (!checklist?.items) return [];
    if (selectedCategory === 'all') return checklist.items;
    return checklist.items.filter((item: ChecklistItem) => item.category === selectedCategory);
  };

  const getItemsByCategory = () => {
    if (!checklist?.items) return {};
    return checklist.items.reduce((acc: Record<string, ChecklistItem[]>, item: ChecklistItem) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  };

  const getCategoryProgress = (items: ChecklistItem[]) => {
    const required = items.filter(item => item.priority === 'required');
    const completed = required.filter(item => 
      ['expert_approved', 'ai_verified'].includes(item.status)
    );
    return required.length > 0 ? Math.round((completed.length / required.length) * 100) : 100;
  };

  const exportChecklist = () => {
    if (!checklist) return;

    const checklistText = `
Document Checklist - ${checklist.lender_name}
${checklist.case_type.replace('_', ' ').toUpperCase()}
Generated: ${format(new Date(), 'MMMM d, yyyy')}
Overall Progress: ${checklist.overall_progress}%

${Object.entries(getItemsByCategory()).map(([category, items]) => `
${category.replace('_', ' ').toUpperCase()}
${(items as ChecklistItem[]).map((item: ChecklistItem) => 
  `☐ ${item.document_name} (${item.priority}) - ${item.status.replace('_', ' ')}`
).join('\n')}
`).join('\n')}
    `.trim();

    const blob = new Blob([checklistText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-${transactionId}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!checklist && !showGenerator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>
            Generate a personalized document checklist for your case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowGenerator(true)} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Generate Document Checklist
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showGenerator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generate Document Checklist</CardTitle>
          <CardDescription>
            Tell us about your case to create a customized document list
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lender">Lender/Servicer</Label>
              <Select
                value={formData.lender_name}
                onValueChange={(value) => setFormData({ ...formData, lender_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your lender" />
                </SelectTrigger>
                <SelectContent>
                  {lenders?.map((lender: any) => (
                    <SelectItem key={lender.id} value={lender.name}>
                      {lender.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_type">Case Type</Label>
              <Select
                value={formData.case_type}
                onValueChange={(value) => setFormData({ ...formData, case_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_sale">Short Sale</SelectItem>
                  <SelectItem value="loan_modification">Loan Modification</SelectItem>
                  <SelectItem value="forbearance">Forbearance</SelectItem>
                  <SelectItem value="repayment_plan">Repayment Plan</SelectItem>
                  <SelectItem value="deed_in_lieu">Deed in Lieu</SelectItem>
                  <SelectItem value="payment_deferral">Payment Deferral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type">Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary_residence">Primary Residence</SelectItem>
                  <SelectItem value="second_home">Second Home</SelectItem>
                  <SelectItem value="investment_property">Investment Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment Status</Label>
              <Select
                value={formData.employment_status}
                onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="w2_employed">W-2 Employee</SelectItem>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delinquency_status">Delinquency Status</Label>
              <Select
                value={formData.delinquency_status}
                onValueChange={(value) => setFormData({ ...formData, delinquency_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delinquency status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="< 3 months">Less than 3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                  <SelectItem value="12-18 months">12-18 months</SelectItem>
                  <SelectItem value="> 18 months">More than 18 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rental_income"
                checked={formData.has_rental_income}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, has_rental_income: checked as boolean })
                }
              />
              <Label htmlFor="rental_income">I have rental income</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="coborrower"
                checked={formData.has_coborrower}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, has_coborrower: checked as boolean })
                }
              />
              <Label htmlFor="coborrower">I have a co-borrower</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGenerator(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateChecklist}
              disabled={generateChecklist.isPending}
              className="flex-1"
            >
              {generateChecklist.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Checklist
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Checklist - {checklist.lender_name}</CardTitle>
              <CardDescription>
                {checklist.case_type.replace('_', ' ')} • {checklist.property_type.replace('_', ' ')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{checklist.overall_progress}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <Progress value={checklist.overall_progress} className="w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="default">{checklist.total_required}</Badge>
                <span className="text-muted-foreground">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{checklist.total_completed}</Badge>
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {checklist.items.length - checklist.total_required}
                </Badge>
                <span className="text-muted-foreground">Optional</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportChecklist}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Guidance */}
      {checklist.ai_guidance && (
        <Alert>
          <Bot className="h-4 w-4" />
          <AlertDescription>{checklist.ai_guidance}</AlertDescription>
        </Alert>
      )}

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </Button>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(getItemsByCategory()).map(category => (
                    <SelectItem key={category} value={category}>
                      {categoryIcons[category]} {category.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {Object.entries(getItemsByCategory()).map(([category, items]) => {
                if (selectedCategory !== 'all' && selectedCategory !== category) return null;
                
                const categoryProgress = getCategoryProgress(items as ChecklistItem[]);
                const isExpanded = expandedCategories.has(category);

                return (
                  <div key={category} className="border rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        <span className="text-lg">{categoryIcons[category]}</span>
                        <div className="text-left">
                          <div className="font-medium">{category.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {(items as ChecklistItem[]).length} document{(items as ChecklistItem[]).length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={categoryProgress} className="w-24" />
                        <span className="text-sm font-medium">{categoryProgress}%</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t">
                        {(items as ChecklistItem[]).map((item: ChecklistItem) => (
                          <div
                            key={item.id}
                            className="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.document_name}</span>
                                  <Badge variant={item.priority === 'required' ? 'default' : 
                                    item.priority === 'conditional' ? 'secondary' : 'outline'}>
                                    {item.priority}
                                  </Badge>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                )}
                                {item.due_date && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                                  </p>
                                )}
                                {item.rejection_reason && (
                                  <Alert className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{item.rejection_reason}</AlertDescription>
                                  </Alert>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={cn('gap-1', statusColors[item.status])}>
                                  {statusIcons[item.status]}
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                {item.ai_confidence_score && (
                                  <Badge variant="outline" className="gap-1">
                                    <Bot className="w-3 h-3" />
                                    {Math.round(item.ai_confidence_score * 100)}%
                                  </Badge>
                                )}
                                {item.status === 'not_started' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) handleFileUpload(item.id, file);
                                      };
                                      input.click();
                                    }}
                                  >
                                    <Upload className="w-4 h-4 mr-1" />
                                    Upload
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredItems().map((item: ChecklistItem) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{item.document_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {categoryIcons[item.category]} {item.category.replace('_', ' ')}
                        </CardDescription>
                      </div>
                      <Badge variant={item.priority === 'required' ? 'default' : 
                        item.priority === 'conditional' ? 'secondary' : 'outline'}>
                        {item.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={cn('gap-1', statusColors[item.status])}>
                          {statusIcons[item.status]}
                          {item.status.replace('_', ' ')}
                        </Badge>
                        {item.ai_confidence_score && (
                          <Badge variant="outline" className="gap-1">
                            <Bot className="w-3 h-3" />
                            {Math.round(item.ai_confidence_score * 100)}%
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      )}
                      {item.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                      {item.status === 'not_started' && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleFileUpload(item.id, file);
                            };
                            input.click();
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Document
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentChecklistGenerator;