import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Clock, FileText, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaseMemoryPanelProps {
  onClose: () => void;
  className?: string;
}

export function CaseMemoryPanel({ onClose, className }: CaseMemoryPanelProps) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20 }}
      className={cn('bg-background flex flex-col', className)}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-lavender-mist" />
          <h2 className="font-semibold">Case Memory</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="conversations" className="flex items-center gap-1">
            <Clock size={14} />
            History
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText size={14} />
            Documents
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-1">
            <Brain size={14} />
            Decisions
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <TrendingUp size={14} />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="conversations" className="p-4">
            <ConversationHistory />
          </TabsContent>
          
          <TabsContent value="documents" className="p-4">
            <DocumentMemory />
          </TabsContent>
          
          <TabsContent value="decisions" className="p-4">
            <DecisionTimeline />
          </TabsContent>
          
          <TabsContent value="insights" className="p-4">
            <LearningInsights />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
}

function ConversationHistory() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Previous Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All your conversations are remembered and used to provide better assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentMemory() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All uploaded documents and extracted information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionTimeline() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Key decisions and recommendations made throughout your journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LearningInsights() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pattern Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Insights learned from similar cases to help your journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}