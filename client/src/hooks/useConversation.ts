import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  context?: any;
  attachments?: Array<{ name: string; type: string }>;
}

interface SendOptions {
  isEscalation?: boolean;
}

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm here to help you navigate through your loss mitigation journey. I understand this can be overwhelming, but we'll take it one step at a time. What's your most pressing concern right now?",
      timestamp: new Date(),
      confidence: 0.95
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentContext, setCurrentContext] = useState('Getting Started');
  const [confidence, setConfidence] = useState(0.85);

  const sendMessage = useCallback(async (content: string, options?: SendOptions) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Get auth headers
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
      };

      // Send to AI service
      const response = await fetch('/api/v1/ai/conversation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          context: {
            previousMessages: messages.slice(-5),
            timestamp: new Date().toISOString(),
            isEscalation: options?.isEscalation
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        confidence: data.confidence || 0.85,
        context: data.context
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentContext(data.currentContext || 'Active Conversation');
      setConfidence(data.confidence || 0.85);

    } catch (error) {
      console.error('Error in conversation:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        type: 'system',
        content: 'I apologize, but I encountered an error. Please try again or click the phone icon to speak with a human expert.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [messages]);

  return {
    messages,
    sendMessage,
    isThinking,
    currentContext,
    confidence
  };
}