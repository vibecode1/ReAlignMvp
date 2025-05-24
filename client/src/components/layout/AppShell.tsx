import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebarContent } from './AppSidebarContent';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false);

  const handleMobileSidebarToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Fixed Sidebar - Always visible on desktop, overlays content */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 bottom-0 z-40 transition-all duration-200 ease-in-out"
          onMouseEnter={() => setDesktopSidebarExpanded(true)}
          onMouseLeave={() => setDesktopSidebarExpanded(false)}
          style={{
            width: desktopSidebarExpanded ? '16rem' : '3rem',
          }}
        >
          <div className="h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
            <AppSidebarContent isExpanded={desktopSidebarExpanded} isMobile={false} />
          </div>
        </div>
      )}

      {/* Mobile Full Screen Navigation */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 bg-white z-50">
          <AppSidebarContent isExpanded={true} isMobile={true} onClose={handleMobileSidebarToggle} />
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && !mobileSidebarOpen && (
        <header className="fixed top-0 left-0 right-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-center">
            <Logo size="sm" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileSidebarToggle}
            className="text-foreground hover:bg-accent"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        </header>
      )}

      {/* Main Content - Fixed with scroll, no left margin on mobile */}
      <main 
        className="fixed top-0 right-0 bottom-0 overflow-y-auto"
        style={{
          left: isMobile ? '0' : '3rem',
          paddingTop: isMobile ? '4rem' : '0',
          paddingLeft: isMobile ? '1rem' : '1rem',
          paddingRight: '1rem',
          paddingBottom: '1rem',
        }}
      >
        <div className="py-4 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
