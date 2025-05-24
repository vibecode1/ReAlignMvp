import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f9f9f9]">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-brand-primary hover:bg-brand-primary/10"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex-1 flex justify-center">
              <Logo size="sm" />
            </div>
            
            {/* Spacer to balance the layout */}
            <div className="w-10"></div>
          </div>
        </header>
      )}

      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      
      <main className={`flex-1 p-4 lg:p-8 ${isMobile ? 'pt-20' : 'lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
