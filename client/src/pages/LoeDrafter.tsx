import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Save, RefreshCw, FileText, History, Send, Archive, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const templateTypes = [
  { value: 'unemployment', label: 'Unemployment' },
  { value: 'medical_hardship', label: 'Medical Hardship' },
  { value: 'divorce_separation', label: 'Divorce or Separation' },
  { value: 'death_of_spouse', label: 'Death of Spouse' },
  { value: 'income_reduction', label: 'Income Reduction' },
  { value: 'business_failure', label: 'Business Failure' },
  { value: 'military_service', label: 'Military Service' },
  { value: 'natural_disaster', label: 'Natural Disaster' },
  { value: 'increased_expenses', label: 'Increased Expenses' },
  { value: 'other_hardship', label: 'Other Hardship' },
];

const statusBadgeVariants = {
  draft: 'default',
  in_review: 'secondary',
  approved: 'default',
  sent: 'outline',
  archived: 'secondary',
} as const;

export default function LoeDrafter() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState('unemployment');
  const [customContext, setCustomContext] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Fetch LOE drafts for this transaction
  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ['loe-drafts', transactionId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/loe/transaction/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch LOE drafts');
      return response.json();
    },
  });

  // Fetch specific draft with versions
  const { data: draftData, isLoading: draftLoading } = useQuery({
    queryKey: ['loe-draft', selectedDraftId],
    queryFn: async () => {
      if (!selectedDraftId) return null;
      const response = await fetch(`/api/v1/loe/draft/${selectedDraftId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch LOE draft');
      return response.json();
    },
    enabled: !!selectedDraftId,
  });

  // Create new LOE draft mutation
  const createDraftMutation = useMutation({
    mutationFn: async (data: {
      template_type: string;
      custom_context?: string;
      generate_with_ai: boolean;
    }) => {
      const response = await fetch('/api/v1/loe/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          ...data,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create LOE draft');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loe-drafts', transactionId] });
      setSelectedDraftId(data.data.id);
      setLetterContent(data.data.letter_content);
      toast({
        title: "Success",
        description: "LOE draft created successfully",
      });
    },
    onError: (error) => {
      console.error('LOE Draft creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create LOE draft",
        variant: "destructive",
      });
    },
  });

  // Update LOE draft mutation
  const updateDraftMutation = useMutation({
    mutationFn: async (data: {
      letter_content?: string;
      status?: string;
      change_summary?: string;
    }) => {
      if (!selectedDraftId) throw new Error('No draft selected');
      const response = await fetch(`/api/v1/loe/draft/${selectedDraftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update LOE draft');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loe-draft', selectedDraftId] });
      queryClient.invalidateQueries({ queryKey: ['loe-drafts', transactionId] });
      toast({
        title: "Success",
        description: "LOE draft updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update LOE draft",
        variant: "destructive",
      });
    },
  });

  // Generate AI suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDraftId) throw new Error('No draft selected');
      const response = await fetch(`/api/v1/loe/draft/${selectedDraftId}/suggestions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate suggestions');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Suggestions Generated",
        description: (
          <div className="mt-2 space-y-1">
            {data.data.suggestions.map((suggestion: string, index: number) => (
              <p key={index} className="text-sm">• {suggestion}</p>
            ))}
          </div>
        ),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    },
  });

  // Export LOE draft
  const exportDraft = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!selectedDraftId) return;
    
    try {
      const response = await fetch(
        `/api/v1/loe/draft/${selectedDraftId}/export?format=${format}`, 
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to export LOE draft');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LOE_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `LOE exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export LOE draft",
        variant: "destructive",
      });
    }
  };

  // Update letter content when draft data changes
  useEffect(() => {
    if (draftData?.data?.draft) {
      setLetterContent(draftData.data.draft.letter_content);
    }
  }, [draftData]);

  const currentDraft = draftData?.data?.draft;
  const versions = draftData?.data?.versions || [];
  const drafts = draftsData?.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Letter of Explanation (LOE) Drafter</h1>
          <p className="text-muted-foreground">Generate and manage hardship letters for your transaction</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(`/transactions/${transactionId}`)}
        >
          Back to Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Draft list */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LOE Drafts</CardTitle>
              <CardDescription>Select or create a new draft</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Create New Draft
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New LOE Draft</DialogTitle>
                    <DialogDescription>
                      Select a template type and optionally provide additional context
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Select value={selectedTemplateType} onValueChange={setSelectedTemplateType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Additional context or specific details (optional)"
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => createDraftMutation.mutate({
                          template_type: selectedTemplateType,
                          custom_context: customContext,
                          generate_with_ai: true,
                        })}
                        disabled={createDraftMutation.isPending}
                      >
                        Generate with AI
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => createDraftMutation.mutate({
                          template_type: selectedTemplateType,
                          generate_with_ai: false,
                        })}
                        disabled={createDraftMutation.isPending}
                      >
                        Use Basic Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {draftsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading drafts...</p>
                  ) : drafts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No drafts yet</p>
                  ) : (
                    drafts.map((draft: any) => (
                      <Card
                        key={draft.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDraftId === draft.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedDraftId(draft.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{draft.letter_title}</p>
                            <Badge variant={statusBadgeVariants[draft.status as keyof typeof statusBadgeVariants]}>
                              {draft.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {templateTypes.find(t => t.value === draft.template_type)?.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Version {draft.current_version} • {new Date(draft.updated_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDraftId && currentDraft ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{currentDraft.letter_title}</CardTitle>
                      <CardDescription>
                        Version {currentDraft.current_version} • 
                        {currentDraft.ai_generated && ' AI Generated • '}
                        Last updated: {new Date(currentDraft.updated_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSuggestionsMutation.mutate()}
                        disabled={generateSuggestionsMutation.isPending}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${generateSuggestionsMutation.isPending ? 'animate-spin' : ''}`} />
                        AI Suggestions
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersionHistory(!showVersionHistory)}
                      >
                        <History className="mr-2 h-4 w-4" />
                        History
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="edit">
                    <TabsList className="mb-4">
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edit">
                      <Textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Start typing your letter..."
                      />
                      <div className="flex justify-between mt-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateDraftMutation.mutate({
                              letter_content: letterContent,
                              change_summary: "Manual content update",
                            })}
                            disabled={updateDraftMutation.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                          <Select
                            value={currentDraft.status}
                            onValueChange={(value) => updateDraftMutation.mutate({ status: value })}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDraft('txt')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            TXT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDraft('docx')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Word
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportDraft('pdf')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview">
                      <Card className="p-6">
                        <div className="prose max-w-none">
                          <pre className="whitespace-pre-wrap font-sans">{letterContent}</pre>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Version History */}
              {showVersionHistory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>View and restore previous versions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {versions.map((version: any) => (
                          <Card
                            key={version.id}
                            className={`cursor-pointer transition-colors ${
                              selectedVersion === version.version_number ? 'border-primary' : ''
                            }`}
                            onClick={() => {
                              setSelectedVersion(version.version_number);
                              setLetterContent(version.letter_content);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">Version {version.version_number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {version.change_summary || 'No description'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(version.created_at).toLocaleString()}
                                  </p>
                                </div>
                                {version.ai_assisted_edit && (
                                  <Badge variant="secondary" className="text-xs">
                                    AI Assisted
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No draft selected</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Select an existing draft or create a new one to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}