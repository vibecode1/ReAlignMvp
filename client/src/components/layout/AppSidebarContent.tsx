import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: <Home />, label: 'Dashboard', href: '/dashboard', tooltip: 'Dashboard' },
  { icon: <FileText />, label: 'Transactions', href: '/transactions', tooltip: 'Transactions' },
  { icon: <Bell />, label: 'Notifications', href: '/notifications', tooltip: 'Notifications' },
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
        {/* Mobile Header with Close functionality */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" className="flex-shrink-0" />
              <span className="font-semibold text-lg">ReAlign</span>
            </div>
            {/* Clickable area to close navigation */}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex-1 p-4 space-y-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className="flex items-center gap-3 p-3 text-gray-900 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                onClick={onClose}
              >
                <span className="flex-shrink-0 w-6 h-6">{item.icon}</span>
                <span className="text-base font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 p-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User Name'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleSignOut();
              onClose?.();
            }}
            className="flex items-center gap-3 w-full p-3 text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut className="flex-shrink-0 w-5 h-5" />
            <span className="text-base font-medium">Sign Out</span>
          </button>
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
          <div key={item.href}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
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

      {/* Desktop Footer */}
      <div className="p-2 border-t border-sidebar-border">
        {isExpanded ? (
          <div className="space-y-1">
            <div className="flex items-center w-full p-2 rounded-md hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2 truncate flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name || 'User Name'}</p>
                <p className="text-[0.7rem] text-sidebar-foreground/70 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full p-2 rounded-md text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <LogOut className="flex-shrink-0 w-4 h-4" />
              <span className="ml-2 whitespace-nowrap">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="bg-gray-700 text-white">
                  <p>{user?.name || 'User Name'}</p>
                  {user?.email && <p className="text-xs">{user.email}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleSignOut}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="bg-gray-700 text-white">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};