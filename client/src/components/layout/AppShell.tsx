import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(false);

  // Controls desktop sidebar expansion on hover
  const handleDesktopSidebarOpen = (openState: boolean) => {
    if (!isMobile) {
      setDesktopSidebarOpen(openState);
    }
  };

  return (
    <SidebarProvider 
      open={isMobile ? undefined : desktopSidebarOpen}
      onOpenChange={handleDesktopSidebarOpen}
      defaultOpen={!isMobile}
    >
      <div
        className="flex flex-col lg:flex-row min-h-screen bg-background-light dark:bg-background-dark"
        onMouseEnter={() => { if (!isMobile) handleDesktopSidebarOpen(true); }}
        onMouseLeave={() => { if (!isMobile) handleDesktopSidebarOpen(false); }}
      >
        <Sidebar
          variant="sidebar"
          collapsible={isMobile ? "offcanvas" : "icon"}
          side="left"
          className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        >
          <AppSidebarContent />
        </Sidebar>

        <SidebarInset className="flex-1 p-4 lg:p-8 data-[mobile=true]:pt-20 lg:data-[state=expanded]:ml-[16rem] lg:data-[state=collapsed]:ml-[3rem] transition-[margin-left] duration-200 ease-linear">
          {isMobile && (
            <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
              <SidebarTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-brand-primary hover:bg-brand-primary/10"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SidebarTrigger>
              <div className="flex-1 flex justify-center">
                <Logo size="sm" />
              </div>
              <div className="w-10"></div>
            </header>
          )}
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
