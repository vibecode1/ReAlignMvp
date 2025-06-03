import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  Paperclip, 
  Brain,
  PhoneCall,
  Send,
  Mic,
  MicOff
} from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { MessageBubble } from './MessageBubble';
import { EmotionalIndicator } from './EmotionalIndicator';
import { ConfidenceBar } from './ConfidenceBar';
import { useConversation } from '@/hooks/useConversation';
import { cn } from '@/lib/utils';

interface AICompanionProps {
  onToggleMemory: () => void;
  emotionalState: string;
}

export function AICompanion({ onToggleMemory, emotionalState }: AICompanionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    isThinking,
    currentContext,
    confidence 
  } = useConversation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleEscalate = () => {
    sendMessage('I need to speak with a human expert', { isEscalation: true });
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-deep-ocean text-white rounded-full shadow-2xl flex items-center justify-center group"
      >
        <AIAvatar size="small" state="waiting" />
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-lavender-mist animate-pulse" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed z-50 shadow-2xl',
          isExpanded 
            ? 'inset-4' 
            : 'bottom-4 right-4 w-[400px] h-[600px]'
        )}
      >
        <Card className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-deep-ocean to-ocean-depth text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AIAvatar size="medium" state={isThinking ? 'thinking' : 'active'} />
                <div>
                  <h3 className="font-semibold">ReAlign AI Assistant</h3>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <EmotionalIndicator state={emotionalState} size="small" />
                    <span>•</span>
                    <span>{currentContext}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={onToggleMemory}
                  className="text-white hover:bg-white/20"
                  title="View Case Memory"
                >
                  <Brain size={18} />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleEscalate}
                  className="text-white hover:bg-white/20"
                  title="Talk to Human Expert"
                >
                  <PhoneCall size={18} />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white hover:bg-white/20"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            
            {/* Confidence Indicator */}
            <div className="mt-2">
              <ConfidenceBar confidence={confidence} showLabel />
            </div>
          </div>
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  emotionalState={emotionalState}
                />
              ))}
              
              {isThinking && (
                <div className="flex gap-3">
                  <AIAvatar size="small" state="thinking" />
                  <div className="bg-lavender-mist/20 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-lavender-mist rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-lavender-mist rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-lavender-mist rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Button type="button" size="icon" variant="ghost" title="Attach Document">
                <Paperclip size={20} />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                onClick={toggleVoice}
                className={cn(isVoiceEnabled && "text-sage-green")}
                title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
              >
                {isVoiceEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your case..."
                className="flex-1"
                disabled={isThinking}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isThinking}>
                <Send size={20} />
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              AI-powered guidance • Your data is secure • Everything is remembered
            </p>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}