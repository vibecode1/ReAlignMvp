import React from 'react';
import { AuthenticatedAppHeader } from './AuthenticatedAppHeader';
import { Toaster } from "@/components/ui/toaster";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* New Top Navigation Header */}
      <AuthenticatedAppHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 pt-0">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

export default AppShell;
