import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
  emotionalState?: EmotionalState;
  error?: boolean;
}

interface EmotionalState {
  primary: string;
  intensity: number;
  confidence: number;
}

interface AIChatProps {
  caseId: string;
  onEscalation?: () => void;
  className?: string;
}

export function AIChat({ caseId, onEscalation, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMemory, setHasMemory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to get auth token
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
    };
  };

  useEffect(() => {
    // Load conversation history
    loadConversationHistory();
  }, [caseId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/v1/conversations/${caseId}/history`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        // Transform conversations to messages format
        const allMessages: Message[] = [];
        data.conversations?.forEach((conv: any) => {
          conv.messages?.forEach((msg: any) => {
            allMessages.push({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.timestamp),
              confidence: msg.confidence,
              emotionalState: msg.emotionalState
            });
          });
        });
        setMessages(allMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/v1/ai/conversation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          caseId,
          message: input,
          context: {
            previousMessages: messages.slice(-5),
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        confidence: data.confidence,
        emotionalState: data.emotionalState
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update memory indicator
      if (data.hasMemory !== undefined) {
        setHasMemory(data.hasMemory);
      }

      // Check if escalation is needed
      if (data.shouldEscalate && onEscalation) {
        onEscalation();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Case #{caseId.slice(-6)}
            </Badge>
            {hasMemory && (
              <Badge variant="secondary" className="text-xs">
                Has Context
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Hello! I'm your AI assistant. I'm here to help you with your loss mitigation case. 
                How can I assist you today?
              </AlertDescription>
            </Alert>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] space-y-1",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : message.error
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                  
                  {message.confidence && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(message.confidence * 100)}% confident
                    </Badge>
                  )}
                  
                  {message.emotionalState && (
                    <Badge variant="outline" className="text-xs">
                      {message.emotionalState.primary}
                    </Badge>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}