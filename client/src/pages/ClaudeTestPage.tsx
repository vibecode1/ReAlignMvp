import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, MessageSquare, File, Lightbulb } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const ClaudeTestPage: React.FC = () => {
  const [documentText, setDocumentText] = useState('');
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testDocumentAnalysis = async () => {
    if (!documentText.trim()) {
      toast({ title: "Error", description: "Please enter document text to analyze" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/v1/claude/analyze-document', { documentText });
      const data = await response.json();
      setResult(data);
      toast({ title: "Success", description: "Document analysis completed!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze document" });
    } finally {
      setLoading(false);
    }
  };

  const testEducationGeneration = async () => {
    if (!topic.trim()) {
      toast({ title: "Error", description: "Please enter a topic" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/v1/claude/generate-education', { topic, userLevel: 'intermediate' });
      const data = await response.json();
      setResult(data);
      toast({ title: "Success", description: "Educational content generated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate education content" });
    } finally {
      setLoading(false);
    }
  };

  const testSentimentAnalysis = async () => {
    const validMessages = messages.filter(msg => msg.trim());
    if (validMessages.length === 0) {
      toast({ title: "Error", description: "Please enter at least one message" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/v1/claude/analyze-sentiment', { messages: validMessages });
      const data = await response.json();
      setResult(data);
      toast({ title: "Success", description: "Sentiment analysis completed!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze sentiment" });
    } finally {
      setLoading(false);
    }
  };

  const testTemplateGeneration = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/v1/claude/generate-template', {
        documentType: 'Purchase Agreement',
        transactionContext: {
          propertyAddress: '123 Main St, Los Angeles, CA',
          parties: ['Buyer', 'Seller', 'Agent'],
          transactionStage: 'Initial Offer'
        }
      });
      const data = await response.json();
      setResult(data);
      toast({ title: "Success", description: "Template generated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate template" });
    } finally {
      setLoading(false);
    }
  };

  const testRecommendations = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/v1/claude/get-recommendations', {
        transactionData: {
          status: 'pending_bank_approval',
          daysActive: 45,
          completedTasks: ['Initial Documentation', 'Property Valuation'],
          pendingTasks: ['Bank Approval', 'Final Inspection'],
          parties: ['Buyer', 'Seller', 'Bank Representative', 'Agent'],
          lastActivity: 'Bank requested additional documentation'
        }
      });
      const data = await response.json();
      setResult(data);
      toast({ title: "Success", description: "Recommendations generated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get recommendations" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Claude AI Test Interface
        </h1>
        <p className="text-muted-foreground mt-2">
          Test the powerful Claude AI features integrated into your ReAlign platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Analysis
              </CardTitle>
              <CardDescription>
                Analyze transaction documents for insights and risk factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Paste document text here..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={testDocumentAnalysis} 
                disabled={loading}
                className="w-full"
              >
                Analyze Document
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Education Generation
              </CardTitle>
              <CardDescription>
                Generate educational content on real estate topics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Enter a topic (e.g., 'short sale process')"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
              />
              <Button 
                onClick={testEducationGeneration} 
                disabled={loading}
                className="w-full"
              >
                Generate Education
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sentiment Analysis
              </CardTitle>
              <CardDescription>
                Analyze communication sentiment and tone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((message, index) => (
                <Textarea 
                  key={index}
                  placeholder={`Message ${index + 1}...`}
                  value={message}
                  onChange={(e) => {
                    const newMessages = [...messages];
                    newMessages[index] = e.target.value;
                    setMessages(newMessages);
                  }}
                  rows={2}
                />
              ))}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMessages([...messages, ''])}
                  className="flex-1"
                >
                  Add Message
                </Button>
                <Button 
                  onClick={testSentimentAnalysis} 
                  disabled={loading}
                  className="flex-1"
                >
                  Analyze Sentiment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Template Generation
              </CardTitle>
              <CardDescription>
                Generate document templates for transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testTemplateGeneration} 
                disabled={loading}
                className="w-full"
              >
                Generate Purchase Agreement Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Get AI-powered recommendations for transaction progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testRecommendations} 
                disabled={loading}
                className="w-full"
              >
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Output from Claude AI operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <Badge variant="outline" className="mb-2">
                    Response Received
                  </Badge>
                  <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Run a test to see Claude AI results here
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClaudeTestPage;