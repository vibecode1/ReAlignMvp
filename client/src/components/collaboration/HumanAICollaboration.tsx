import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Bot, Brain, MessageSquare, CheckCircle, 
  AlertCircle, Clock, TrendingUp, Lightbulb, 
  Send, ThumbsUp, ThumbsDown, History
} from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  avatar?: string;
  specialties: string[];
  status: 'available' | 'busy' | 'offline';
  currentLoad: number;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'analysis' | 'warning' | 'pattern';
  content: string;
  confidence: number;
  source: string;
  timestamp: Date;
  applied?: boolean;
}

interface CollaborationMessage {
  id: string;
  sender: 'human' | 'ai' | 'system';
  senderName: string;
  content: string;
  timestamp: Date;
  attachments?: any[];
  insights?: AIInsight[];
  feedback?: 'positive' | 'negative';
}

interface CollaborationSession {
  id: string;
  escalationId: string;
  participants: {
    human: Expert;
    ai: { name: string; model: string };
  };
  status: 'active' | 'paused' | 'resolved';
  startTime: Date;
  messages: CollaborationMessage[];
  resolution?: {
    summary: string;
    actions: string[];
    preventiveMeasures: string[];
  };
}

/**
 * HumanAICollaboration: Seamless collaboration interface for experts and AI
 * 
 * This component enables:
 * 1. Real-time collaboration between human experts and AI
 * 2. AI suggestions and insights during problem-solving
 * 3. Shared context and decision tracking
 * 4. Learning from human decisions
 * 5. Feedback loop for continuous improvement
 */
export function HumanAICollaboration({
  escalationId,
  onResolution
}: {
  escalationId: string;
  onResolution?: (resolution: any) => void;
}) {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [message, setMessage] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showInsightPanel, setShowInsightPanel] = useState(true);

  useEffect(() => {
    // Initialize collaboration session
    initializeSession();
  }, [escalationId]);

  const initializeSession = async () => {
    // In real implementation, would fetch from API
    const mockSession: CollaborationSession = {
      id: `collab_${Date.now()}`,
      escalationId,
      participants: {
        human: {
          id: 'exp_001',
          name: 'Sarah Johnson',
          specialties: ['mortgage', 'compliance'],
          status: 'available',
          currentLoad: 3
        },
        ai: {
          name: 'ReAlign AI Assistant',
          model: 'GPT-4'
        }
      },
      status: 'active',
      startTime: new Date(),
      messages: [
        {
          id: '1',
          sender: 'system',
          senderName: 'System',
          content: 'Collaboration session started. AI is analyzing the escalation context...',
          timestamp: new Date()
        }
      ]
    };

    setSession(mockSession);
    
    // Simulate AI initial analysis
    setTimeout(() => {
      addAiMessage(
        'I\'ve analyzed the escalation. The main issue appears to be repeated document submission failures to Chase. ' +
        'I found 3 similar cases that were resolved by switching to manual portal submission. Shall we try that approach?',
        [
          {
            id: 'ins_1',
            type: 'pattern',
            content: 'Similar cases resolved in 85% by manual portal submission',
            confidence: 0.85,
            source: 'Historical Pattern Analysis',
            timestamp: new Date()
          },
          {
            id: 'ins_2',
            type: 'suggestion',
            content: 'Contact Chase representative for expedited processing',
            confidence: 0.72,
            source: 'Servicer Intelligence',
            timestamp: new Date()
          }
        ]
      );
    }, 2000);
  };

  const sendMessage = () => {
    if (!message.trim() || !session) return;

    const newMessage: CollaborationMessage = {
      id: `msg_${Date.now()}`,
      sender: 'human',
      senderName: session.participants.human.name,
      content: message,
      timestamp: new Date()
    };

    setSession(prev => ({
      ...prev!,
      messages: [...prev!.messages, newMessage]
    }));

    setMessage('');
    
    // Simulate AI response
    setIsAiTyping(true);
    setTimeout(() => {
      generateAiResponse(message);
      setIsAiTyping(false);
    }, 1500);
  };

  const addAiMessage = (content: string, insights?: AIInsight[]) => {
    if (!session) return;

    const aiMessage: CollaborationMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai',
      senderName: session.participants.ai.name,
      content,
      timestamp: new Date(),
      insights
    };

    setSession(prev => ({
      ...prev!,
      messages: [...prev!.messages, aiMessage]
    }));

    if (insights) {
      setAiInsights(prev => [...prev, ...insights]);
    }
  };

  const generateAiResponse = (humanMessage: string) => {
    // Simulate contextual AI responses
    if (humanMessage.toLowerCase().includes('portal')) {
      addAiMessage(
        'I can guide you through the Chase portal submission process. First, ensure you have the latest document versions. ' +
        'The portal typically requires PDF format with file sizes under 10MB. Would you like me to prepare the documents?',
        [
          {
            id: `ins_${Date.now()}`,
            type: 'suggestion',
            content: 'Use PDF compression tool to reduce file size',
            confidence: 0.90,
            source: 'Document Processing',
            timestamp: new Date()
          }
        ]
      );
    } else if (humanMessage.toLowerCase().includes('deadline')) {
      addAiMessage(
        'The closing deadline is in 48 hours. I recommend we escalate to Chase\'s expedited processing team. ' +
        'I can draft an escalation email highlighting the urgency. Should I proceed?',
        [
          {
            id: `ins_${Date.now()}`,
            type: 'warning',
            content: 'Deadline approaching - consider contingency planning',
            confidence: 0.95,
            source: 'Timeline Analysis',
            timestamp: new Date()
          }
        ]
      );
    } else {
      addAiMessage(
        'I understand. Let me analyze the best approach based on current constraints and historical success patterns.'
      );
    }
  };

  const applyInsight = (insight: AIInsight) => {
    // Mark insight as applied
    setAiInsights(prev =>
      prev.map(i => i.id === insight.id ? { ...i, applied: true } : i)
    );

    // Add system message
    const systemMessage: CollaborationMessage = {
      id: `msg_${Date.now()}`,
      sender: 'system',
      senderName: 'System',
      content: `Applied AI insight: ${insight.content}`,
      timestamp: new Date()
    };

    setSession(prev => ({
      ...prev!,
      messages: [...prev!.messages, systemMessage]
    }));
  };

  const provideFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setSession(prev => ({
      ...prev!,
      messages: prev!.messages.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    }));

    // In real implementation, would send feedback to learning system
  };

  const resolveSession = () => {
    const resolution = {
      summary: 'Successfully submitted documents through manual portal after AI-guided preparation',
      actions: [
        'Compressed PDF documents to meet portal requirements',
        'Submitted through Chase portal with expedited flag',
        'Received confirmation number: CHZ-2024-0523'
      ],
      preventiveMeasures: [
        'Set up automated document compression for future submissions',
        'Add portal submission as primary method for Chase',
        'Monitor portal requirements for changes'
      ]
    };

    setSession(prev => ({
      ...prev!,
      status: 'resolved',
      resolution
    }));

    onResolution?.(resolution);
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Initializing collaboration session...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Collaboration Area */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <CardTitle>Collaboration Session</CardTitle>
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {session.participants.human.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Bot className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 py-4">
                {session.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === 'human' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {msg.sender === 'ai' ? (
                        <Bot className="h-5 w-5" />
                      ) : msg.sender === 'system' ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <AvatarFallback>
                          {msg.senderName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className={`flex-1 ${msg.sender === 'human' ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <div
                        className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                          msg.sender === 'human'
                            ? 'bg-primary text-primary-foreground'
                            : msg.sender === 'system'
                            ? 'bg-muted'
                            : 'bg-secondary'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>

                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => provideFeedback(msg.id, 'positive')}
                            className={msg.feedback === 'positive' ? 'text-green-600' : ''}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => provideFeedback(msg.id, 'negative')}
                            className={msg.feedback === 'negative' ? 'text-red-600' : ''}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {msg.insights && msg.insights.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.insights.map((insight) => (
                            <Alert key={insight.id} className="py-2">
                              <Lightbulb className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {insight.content}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <Bot className="h-5 w-5" />
                    </Avatar>
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your message..."
                className="min-h-[60px]"
              />
              <Button onClick={sendMessage} disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">AI Insights</CardTitle>
              <Brain className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-3">
                {aiInsights
                  .filter(i => !i.applied)
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm mb-2">{insight.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {insight.source}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyInsight(insight)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="history" className="space-y-3">
                {aiInsights
                  .filter(i => i.applied)
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 rounded-lg border bg-muted opacity-60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {insight.type}
                        </Badge>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm">{insight.content}</p>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Session Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowInsightPanel(!showInsightPanel)}
            >
              <History className="h-4 w-4 mr-2" />
              View Full History
            </Button>
            <Button 
              className="w-full"
              onClick={resolveSession}
              disabled={session.status === 'resolved'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          </CardContent>
        </Card>

        {/* Expert Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Expert Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {session.participants.human.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{session.participants.human.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.participants.human.specialties.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Load</span>
                <span>{session.participants.human.currentLoad} cases</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Session Time</span>
                <span>
                  {Math.round((Date.now() - session.startTime.getTime()) / 60000)} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}