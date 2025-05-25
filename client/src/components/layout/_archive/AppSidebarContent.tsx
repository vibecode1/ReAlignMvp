import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Bell, LogOut, Menu, User, TrendingUp, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ReAlignLogo } from '@/components/ui/realign-logo';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: <Home className="sidebar-nav-icon" />, label: 'Dashboard', href: '/dashboard', tooltip: 'Dashboard', category: 'main' },
  { icon: <FileText className="sidebar-nav-icon" />, label: 'Transactions', href: '/transactions', tooltip: 'Transactions', category: 'main' },
  { icon: <TrendingUp className="sidebar-nav-icon" />, label: 'Analytics', href: '/analytics', tooltip: 'Analytics', category: 'main' },
  { icon: <Bell className="sidebar-nav-icon" />, label: 'Notifications', href: '/notifications', tooltip: 'Notifications', category: 'settings' },
  { icon: <User className="sidebar-nav-icon" />, label: 'Account', href: '/account', tooltip: 'Account', category: 'settings' },
  { icon: <LogOut className="sidebar-nav-icon" />, label: 'Log Out', href: '#', tooltip: 'Log Out', isAction: true, category: 'settings' },
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
      <div className="flex flex-col h-full bg-white dark:bg-sidebar-background text-foreground">
        {/* Mobile Header with enhanced ReAlign 2.0 branding */}
        <div className="sidebar-brand">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-center flex-1">
              <ReAlignLogo size="sm" showText={true} />
            </div>
            {/* Enhanced hamburger button */}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-sidebar-accent rounded-xl transition-colors"
              aria-label="Close navigation"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation with ReAlign 2.0 styling */}
        <div className="flex-1 p-4 space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main
            </h3>
            {navItems.filter(item => item.category === 'main').map((item) => (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`sidebar-nav-item ${location === item.href ? 'active' : ''}`}
                  onClick={onClose}
                >
                  {item.icon}
                  <span className="ml-3 text-base font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Settings Navigation */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Settings
            </h3>
            {navItems.filter(item => item.category === 'settings').map((item) => (
              item.isAction ? (
                <div 
                  key={item.label}
                  className="sidebar-nav-item hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    handleSignOut();
                    onClose?.();
                  }}
                >
                  {item.icon}
                  <span className="ml-3 text-base font-medium">{item.label}</span>
                </div>
              ) : (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={`sidebar-nav-item ${location === item.href ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span className="ml-3 text-base font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            ))}
          </div>
        </div>


      </div>
    );
  }

  return (
    <div className="flex flex-col h-full sidebar-transition">
      {/* Enhanced Desktop Header with ReAlign 2.0 branding */}
      <div className="sidebar-brand">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105">
            <ReAlignLogo size="sm" showText={isExpanded} />
          </div>
        </Link>
      </div>

      {/* Enhanced Desktop Navigation with ReAlign 2.0 styling */}
      <div className="flex-1 p-3 space-y-6">
        {/* Main Navigation Section */}
        <div className="space-y-1">
          {isExpanded && (
            <h3 className="px-3 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider mb-3">
              Main
            </h3>
          )}
          {navItems.filter(item => item.category === 'main').map((item) => (
            <div key={item.href || item.label}>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div 
                        className={`sidebar-nav-item ${
                          location === item.href ? 'active' : ''
                        } ${!isExpanded ? 'justify-center' : 'justify-start'}`}
                      >
                        {item.icon}
                        {isExpanded && (
                          <span className="ml-3 whitespace-nowrap font-medium">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" align="center" className="bg-sidebar-background text-sidebar-foreground border-sidebar-border">
                      {item.tooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>

        {/* Settings Navigation Section */}
        <div className="space-y-1">
          {isExpanded && (
            <h3 className="px-3 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider mb-3">
              Settings
            </h3>
          )}
          {navItems.filter(item => item.category === 'settings').map((item) => (
            <div key={item.href || item.label}>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {item.isAction ? (
                      <div 
                        className={`sidebar-nav-item hover:bg-destructive hover:text-destructive-foreground ${!isExpanded ? 'justify-center' : 'justify-start'}`}
                        onClick={handleSignOut}
                      >
                        {item.icon}
                        {isExpanded && (
                          <span className="ml-3 whitespace-nowrap font-medium">
                            {item.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Link href={item.href}>
                        <div 
                          className={`sidebar-nav-item ${
                            location === item.href ? 'active' : ''
                          } ${!isExpanded ? 'justify-center' : 'justify-start'}`}
                        >
                          {item.icon}
                          {isExpanded && (
                            <span className="ml-3 whitespace-nowrap font-medium">
                              {item.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )}
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" align="center" className="bg-sidebar-background text-sidebar-foreground border-sidebar-border">
                      {item.tooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};