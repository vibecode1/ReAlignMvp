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
}

export const AppSidebarContent: React.FC<AppSidebarContentProps> = ({ isExpanded }) => {
  const [location] = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Navigation */}
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

      {/* Footer */}
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