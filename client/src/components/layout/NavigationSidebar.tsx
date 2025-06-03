import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FolderOpen, FileText, Brain, HelpCircle, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/app/dashboard', icon: Home, label: 'Home' },
  { to: '/app/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/app/documents', icon: FileText, label: 'Documents' },
  { to: '/app/learning', icon: Brain, label: 'Insights' },
  { to: '/app/help', icon: HelpCircle, label: 'Help' },
];

export function NavigationSidebar() {
  const [location] = useLocation();
  const { signOut } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-16 bg-deep-ocean text-white flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <img src="/logo.svg" alt="ReAlign" className="w-8 h-8" />
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.to);
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <Link href={item.to}>
                    <a
                      className={cn(
                        'flex items-center justify-center h-12 w-full relative transition-all',
                        'hover:bg-white/10',
                        isActive && 'bg-white/20'
                      )}
                    >
                      <Icon size={20} />
                      {isActive && (
                        <div className="absolute left-0 top-0 h-full w-1 bg-calm-sky" />
                      )}
                    </a>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        
        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={signOut}
                className="flex items-center justify-center h-10 w-full hover:bg-white/10 rounded transition-colors"
              >
                <LogOut size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}