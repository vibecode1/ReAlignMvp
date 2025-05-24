import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Bell, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: <Home />, label: 'Dashboard', href: '/dashboard', tooltip: 'Dashboard' },
  { icon: <FileText />, label: 'Transactions', href: '/transactions', tooltip: 'Transactions' },
  { icon: <Bell />, label: 'Notifications', href: '/notifications', tooltip: 'Notifications' },
  { icon: <User />, label: 'Account', href: '/account', tooltip: 'Account' },
  { icon: <LogOut />, label: 'Log Out', href: '#', tooltip: 'Log Out', isAction: true },
];

interface AppSidebarContentProps {
  isExpanded: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export const AppSidebarContent: React.FC<AppSidebarContentProps> = ({ isExpanded, isMobile = false, onClose }) => {
  const [location] = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-white text-gray-900">
        {/* Mobile Header with hamburger in same position */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Logo size="sm" className="flex-shrink-0" />
            </div>
            {/* Hamburger in same position as when closed */}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close navigation"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex-1 p-4 space-y-4">
          {navItems.map((item) => (
            item.isAction ? (
              <div 
                key={item.label}
                className="flex items-center gap-3 p-3 text-gray-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                onClick={() => {
                  handleSignOut();
                  onClose?.();
                }}
              >
                <span className="flex-shrink-0 w-6 h-6">{item.icon}</span>
                <span className="text-base font-medium">{item.label}</span>
              </div>
            ) : (
              <Link key={item.href} href={item.href}>
                <div 
                  className="flex items-center gap-3 p-3 text-gray-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                  onClick={onClose}
                >
                  <span className="flex-shrink-0 w-6 h-6">{item.icon}</span>
                  <span className="text-base font-medium">{item.label}</span>
                </div>
              </Link>
            )
          ))}
        </div>


      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Header */}
      <div className="p-3 border-b border-sidebar-border">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
            <Logo size="sm" className="flex-shrink-0" />
            {isExpanded && (
              <span className="font-semibold text-lg whitespace-nowrap">
                ReAlign
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <div key={item.href || item.label}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {item.isAction ? (
                    <div 
                      className={`flex items-center w-full p-2 rounded-md text-sm transition-colors cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${!isExpanded ? 'justify-center' : 'justify-start'}`}
                      onClick={handleSignOut}
                    >
                      <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                      {isExpanded && (
                        <span className="ml-2 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Link href={item.href}>
                      <div 
                        className={`flex items-center w-full p-2 rounded-md text-sm transition-colors cursor-pointer ${
                          location === item.href 
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        } ${!isExpanded ? 'justify-center' : 'justify-start'}`}
                      >
                        <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                        {isExpanded && (
                          <span className="ml-2 whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" align="center" className="bg-gray-700 text-white">
                    {item.tooltip}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>


    </div>
  );
};