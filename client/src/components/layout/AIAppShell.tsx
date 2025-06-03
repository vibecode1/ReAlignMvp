import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { AICompanion } from '@/components/ai/AICompanion';
import { NavigationSidebar } from './NavigationSidebar';
import { JourneyVisualization } from '@/components/journey/JourneyVisualization';
import { CaseMemoryPanel } from '@/components/memory/CaseMemoryPanel';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

interface EmotionalStateContext {
  state: 'confident' | 'stressed' | 'confused' | 'hopeful';
  setState: (state: 'confident' | 'stressed' | 'confused' | 'hopeful') => void;
}

export const EmotionalStateContext = React.createContext<EmotionalStateContext>({
  state: 'confident',
  setState: () => {},
});

export function AIAppShell({ children }: { children: React.ReactNode }) {
  const [showMemory, setShowMemory] = useState(false);
  const [emotionalState, setEmotionalState] = useState<'confident' | 'stressed' | 'confused' | 'hopeful'>('confident');
  const [location] = useLocation();
  const { user } = useAuth();

  // Update emotional state based on AI detection
  useEffect(() => {
    // This would be connected to real AI emotional detection
    const detectEmotionalState = () => {
      if (location.includes('hardship')) setEmotionalState('stressed');
      else if (location.includes('documents')) setEmotionalState('confused');
      else if (location.includes('progress')) setEmotionalState('hopeful');
      else setEmotionalState('confident');
    };

    detectEmotionalState();
  }, [location]);

  return (
    <EmotionalStateContext.Provider value={{ state: emotionalState, setState: setEmotionalState }}>
      <div className={cn(
        'flex h-screen bg-background transition-all duration-1000',
        `emotional-${emotionalState}`
      )}>
        {/* Minimal Navigation Sidebar */}
        <NavigationSidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Journey Progress Bar */}
          <JourneyVisualization className="h-20 border-b" />
          
          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-6xl mx-auto">
                {children}
              </div>
            </div>
            
            {/* Case Memory Panel (collapsible) */}
            {showMemory && (
              <CaseMemoryPanel 
                onClose={() => setShowMemory(false)}
                className="w-96 border-l"
              />
            )}
          </div>
        </main>
        
        {/* Persistent Conversational AI */}
        <AICompanion 
          onToggleMemory={() => setShowMemory(!showMemory)}
          emotionalState={emotionalState}
        />
        
        <Toaster />
      </div>
    </EmotionalStateContext.Provider>
  );
}

export const useEmotionalState = () => React.useContext(EmotionalStateContext);