
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, MessageSquare, FileText, Save, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';

interface UBAFormSection {
  id: string;
  title: string;
  description: string;
  fields: UBAField[];
  completed: boolean;
  validationErrors: string[];
}

interface UBAField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'currency';
  label: string;
  value: string;
  required: boolean;
  options?: string[];
  validation?: string;
  aiSuggestion?: string;
  confidence?: number;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export const UBAFormMaker: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('borrower-info');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [conversationMode, setConversationMode] = useState<boolean>(true);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  // UBA Form Sections based on UBA Guide
  const formSections: UBAFormSection[] = [
    {
      id: 'borrower-info',
      title: 'Borrower Information',
      description: 'Primary borrower details and contact information',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'borrower_name',
          name: 'borrower_name',
          type: 'text',
          label: 'Borrower Full Name',
          value: '',
          required: true
        },
        {
          id: 'borrower_ssn',
          name: 'borrower_ssn',
          type: 'text',
          label: 'Social Security Number',
          value: '',
          required: true,
          validation: 'SSN format required'
        },
        {
          id: 'borrower_phone',
          name: 'borrower_phone',
          type: 'text',
          label: 'Primary Phone Number',
          value: '',
          required: true
        },
        {
          id: 'borrower_email',
          name: 'borrower_email',
          type: 'text',
          label: 'Email Address',
          value: '',
          required: true
        }
      ]
    },
    {
      id: 'property-info',
      title: 'Property Information',
      description: 'Details about the property subject to foreclosure',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'property_address',
          name: 'property_address',
          type: 'textarea',
          label: 'Property Address',
          value: '',
          required: true
        },
        {
          id: 'property_value',
          name: 'property_value',
          type: 'currency',
          label: 'Current Property Value',
          value: '',
          required: true
        },
        {
          id: 'mortgage_balance',
          name: 'mortgage_balance',
          type: 'currency',
          label: 'Outstanding Mortgage Balance',
          value: '',
          required: true
        },
        {
          id: 'monthly_payment',
          name: 'monthly_payment',
          type: 'currency',
          label: 'Monthly Mortgage Payment',
          value: '',
          required: true
        }
      ]
    },
    {
      id: 'financial-hardship',
      title: 'Financial Hardship',
      description: 'Details about the financial difficulties causing distress',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'hardship_type',
          name: 'hardship_type',
          type: 'select',
          label: 'Type of Hardship',
          value: '',
          required: true,
          options: [
            'Job Loss/Unemployment',
            'Reduced Income',
            'Medical Bills/Illness',
            'Divorce/Separation',
            'Death of Co-borrower',
            'Business Failure',
            'Other'
          ]
        },
        {
          id: 'hardship_description',
          name: 'hardship_description',
          type: 'textarea',
          label: 'Detailed Description of Hardship',
          value: '',
          required: true
        },
        {
          id: 'hardship_date',
          name: 'hardship_date',
          type: 'date',
          label: 'Date Hardship Began',
          value: '',
          required: true
        }
      ]
    },
    {
      id: 'income-expenses',
      title: 'Income & Expenses',
      description: 'Current monthly income and expense details',
      completed: false,
      validationErrors: [],
      fields: [
        {
          id: 'monthly_income',
          name: 'monthly_income',
          type: 'currency',
          label: 'Total Monthly Income',
          value: '',
          required: true
        },
        {
          id: 'monthly_expenses',
          name: 'monthly_expenses',
          type: 'currency',
          label: 'Total Monthly Expenses',
          value: '',
          required: true
        },
        {
          id: 'income_sources',
          name: 'income_sources',
          type: 'textarea',
          label: 'Sources of Income',
          value: '',
          required: true
        }
      ]
    }
  ];

  const [sections, setSections] = useState<UBAFormSection[]>(formSections);

  // Initialize conversation
  useEffect(() => {
    if (conversationMode && messages.length === 0) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: "Hello! I'm here to help you complete your Borrower Financial Statement (UBA form). I'll guide you through each section step by step. Let's start with some basic information about you as the borrower. What's your full legal name?",
          timestamp: new Date()
        }
      ]);
    }
  }, [conversationMode]);

  // Calculate completion percentage
  useEffect(() => {
    const totalFields = sections.reduce((total, section) => total + section.fields.length, 0);
    const completedFields = sections.reduce((completed, section) => 
      completed + section.fields.filter(field => field.value.trim() !== '').length, 0
    );
    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  }, [sections]);

  // AI Processing for conversational input
  const processConversationalInput = useMutation({
    mutationFn: async (input: string) => {
      const response = await fetch('/api/v1/uba-forms/process-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: input,
          currentFormData: formData,
          activeSection: activeSection
        })
      });
      if (!response.ok) throw new Error('Failed to process input');
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to conversation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.extracted_data
      }]);

      // Update form data if AI extracted information
      if (data.extracted_data) {
        setFormData(prev => ({ ...prev, ...data.extracted_data }));
        
        // Update sections with extracted data
        setSections(prevSections => 
          prevSections.map(section => ({
            ...section,
            fields: section.fields.map(field => ({
              ...field,
              value: data.extracted_data[field.name] || field.value,
              aiSuggestion: data.suggestions?.[field.name],
              confidence: data.confidence?.[field.name]
            }))
          }))
        );
      }

      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    }
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }]);

    setIsProcessing(true);
    processConversationalInput.mutate(currentMessage);
    setCurrentMessage('');
  };

  const handleFieldChange = (sectionId: string, fieldId: string, value: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map(field =>
                field.id === fieldId ? { ...field, value } : field
              )
            }
          : section
      )
    );
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const toggleMode = () => {
    setConversationMode(!conversationMode);
  };

  const saveForm = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/uba-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          form_data: formData,
          completion_percentage: completionPercentage,
          sections: sections
        })
      });
      if (!response.ok) throw new Error('Failed to save form');
      return response.json();
    }
  });

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BFS/UBA Form Maker</h1>
          <p className="text-muted-foreground">Borrower Financial Statement - AI-Assisted Completion</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Progress: {completionPercentage}%
          </div>
          <Progress value={completionPercentage} className="w-32" />
          <Button
            variant={conversationMode ? "default" : "outline"}
            onClick={toggleMode}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {conversationMode ? 'Form View' : 'Chat Mode'}
          </Button>
          <Button onClick={() => saveForm.mutate()} disabled={saveForm.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveForm.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversation Mode */}
        {conversationMode ? (
          <div className="lg:col-span-8">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Chat with our AI to complete your BFS/UBA form naturally
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">AI is processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your response..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isProcessing}
                  />
                  <Button onClick={handleSendMessage} disabled={isProcessing || !currentMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Form Mode */
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {sections.map((section) => (
                <Card key={section.id} className={activeSection === section.id ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {section.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                          {section.title}
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}
                      >
                        {activeSection === section.id ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </CardHeader>
                  {activeSection === section.id && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {field.type === 'select' ? (
                              <Select
                                value={field.value}
                                onValueChange={(value) => handleFieldChange(section.id, field.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === 'textarea' ? (
                              <Textarea
                                id={field.id}
                                value={field.value}
                                onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                              />
                            ) : (
                              <Input
                                id={field.id}
                                type={field.type === 'currency' ? 'number' : field.type}
                                value={field.value}
                                onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                              />
                            )}
                            {field.aiSuggestion && (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  AI Suggestion: {field.aiSuggestion}
                                </Badge>
                                {field.confidence && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(field.confidence * 100)}% confident
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-4">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Form Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sections.map((section) => {
                    const completedFields = section.fields.filter(f => f.value.trim() !== '').length;
                    const totalFields = section.fields.length;
                    const sectionProgress = Math.round((completedFields / totalFields) * 100);
                    
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{section.title}</span>
                          <span>{sectionProgress}%</span>
                        </div>
                        <Progress value={sectionProgress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Use the chat mode for a guided experience</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Switch to form mode for direct editing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI suggestions appear automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Save frequently to preserve your progress</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UBAFormMaker;
