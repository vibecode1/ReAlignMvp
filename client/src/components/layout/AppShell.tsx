import React from 'react';
import { Sidebar } from './Sidebar';
import { useMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const isMobile = useMobile();
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f9f9f9]">
      <Sidebar isMobile={isMobile} />
      
      <main className={`flex-1 p-4 lg:p-8 ${isMobile ? '' : 'lg:ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
