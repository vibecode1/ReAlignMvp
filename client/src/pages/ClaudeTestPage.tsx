import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, MessageSquare, Template, Lightbulb } from 'lucide-react';
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
      const response = await apiRequest('/api/v1/claude/analyze-document', {
        method: 'POST',
        body: { documentText }
      });
      setResult(response.data);
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
      const response = await apiRequest('/api/v1/claude/generate-education', {
        method: 'POST',
        body: { topic, userLevel: 'intermediate' }
      });
      setResult(response.data);
      toast({ title: "Success", description: "Educational content generated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate content" });
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
      const response = await apiRequest('/api/v1/claude/analyze-sentiment', {
        method: 'POST',
        body: { messages: validMessages }
      });
      setResult(response.data);
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
      const response = await apiRequest('/api/v1/claude/generate-template', {
        method: 'POST',
        body: { 
          documentType: 'Purchase Agreement',
          transactionContext: {
            propertyAddress: '123 Main St, Los Angeles, CA',
            parties: ['Buyer', 'Seller', 'Agent'],
            transactionStage: 'Initial Offer'
          }
        }
      });
      setResult(response.data);
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
      const response = await apiRequest('/api/v1/claude/get-recommendations', {
        method: 'POST',
        body: { 
          transactionData: {
            status: 'pending_bank_approval',
            daysActive: 45,
            completedTasks: ['Initial Documentation', 'Property Valuation'],
            pendingTasks: ['Bank Approval', 'Final Inspection'],
            parties: ['Buyer', 'Seller', 'Bank Representative', 'Agent'],
            lastActivity: 'Bank requested additional documentation'
          }
        }
      });
      setResult(response.data);
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
              <Button onClick={testDocumentAnalysis} disabled={loading}>
                Analyze Document
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Educational Content
              </CardTitle>
              <CardDescription>
                Generate educational content on real estate topics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Enter topic (e.g., 'short sale negotiation strategies')"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={2}
              />
              <Button onClick={testEducationGeneration} disabled={loading}>
                Generate Content
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
                Analyze communication sentiment between parties
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
                >
                  Add Message
                </Button>
                <Button onClick={testSentimentAnalysis} disabled={loading}>
                  Analyze Sentiment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Template className="h-5 w-5" />
                Quick Tests
              </CardTitle>
              <CardDescription>
                Test other Claude AI features with sample data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={testTemplateGeneration} disabled={loading}>
                  Generate Template
                </Button>
                <Button variant="outline" onClick={testRecommendations} disabled={loading}>
                  Get Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                Claude AI analysis results will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Processing with Claude AI...</span>
                </div>
              )}
              
              {result && !loading && (
                <div className="space-y-4">
                  {result.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                  )}

                  {result.title && (
                    <div>
                      <h4 className="font-semibold mb-2">Title</h4>
                      <p className="text-sm text-muted-foreground">{result.title}</p>
                    </div>
                  )}

                  {result.content && (
                    <div>
                      <h4 className="font-semibold mb-2">Content</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.content}</p>
                    </div>
                  )}

                  {result.overallSentiment && (
                    <div>
                      <h4 className="font-semibold mb-2">Sentiment Analysis</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={result.overallSentiment === 'positive' ? 'default' : 
                                result.overallSentiment === 'negative' ? 'destructive' : 'secondary'}>
                          {result.overallSentiment}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {result.keyPoints && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Points</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.keyTakeaways && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Takeaways</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.keyTakeaways.map((takeaway: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      {Array.isArray(result.recommendations) ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {result.recommendations.map((rec: any, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {typeof rec === 'string' ? rec : rec.action}
                              {rec.timeframe && <span className="text-xs ml-2">({rec.timeframe})</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {result.template && (
                    <div>
                      <h4 className="font-semibold mb-2">Generated Template</h4>
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded max-h-64 overflow-y-auto">
                        {result.template}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {!result && !loading && (
                <div className="text-center text-muted-foreground p-8">
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