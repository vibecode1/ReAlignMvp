import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: <Home />, label: 'Dashboard', href: '/dashboard', tooltip: 'Dashboard' },
  { icon: <FileText />, label: 'Transactions', href: '/transactions', tooltip: 'Transactions' },
  { icon: <Bell />, label: 'Notifications', href: '/notifications', tooltip: 'Notifications' },
];

export const AppSidebarContent: React.FC = () => {
  const [location] = useLocation();
  const { signOut, user } = useAuth();
  const { open: isSidebarExpanded } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <SidebarHeader className="p-3">
        <Link href="/dashboard">
          <a className="flex items-center gap-2 overflow-hidden">
            <Logo size="sm" className="flex-shrink-0" />
            <span 
              className={`font-semibold text-lg whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? 'opacity-100 delay-100' : 'opacity-0'}`}
            >
              ReAlign
            </span>
          </a>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        className="w-full justify-start text-sm h-10 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <a>
                          <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                          <span 
                            className={`ml-2 whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? 'opacity-100 delay-100' : 'opacity-0'}`}
                          >
                            {item.label}
                          </span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </TooltipTrigger>
                  {!isSidebarExpanded && (
                    <TooltipContent side="right" align="center" className="bg-gray-700 text-white">
                      {item.tooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        {isSidebarExpanded ? (
          <div className="flex flex-col items-start w-full space-y-1">
            <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-sidebar-accent">
              <div className="flex items-center w-full">
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
            </Button>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start text-sm h-9 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="flex-shrink-0 w-4 h-4" />
              <span 
                className={`ml-2 whitespace-nowrap transition-opacity duration-200 ${isSidebarExpanded ? 'opacity-100 delay-100' : 'opacity-0'}`}
              >
                Sign Out
              </span>
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full space-y-1">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-sidebar-accent">
                    <Avatar className="h-full w-full">
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">{user?.name || "User Menu"}</span>
                  </Button>
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
                  <SidebarMenuButton
                    onClick={handleSignOut}
                    className="w-7 h-7 justify-center p-0 hover:bg-sidebar-accent"
                    aria-label="Sign Out"
                  >
                    <LogOut />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="bg-gray-700 text-white">Sign Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </SidebarFooter>
    </>
  );
};