import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  List, 
  Wrench, 
  GraduationCap, 
  User, 
  LogOut, 
  Menu 
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { to: '/transactions', label: 'Tracker', icon: <List size={20} /> },
  { to: '/app/maker', label: 'Maker', icon: <Wrench size={20} /> },
  { to: '/app/advisor', label: 'Advisor', icon: <GraduationCap size={20} /> },
];

const bottomNavItems = [
  { to: '/account', label: 'Profile', icon: <User size={20} /> },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  isExpanded?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  to, 
  label, 
  icon, 
  isExpanded = true, 
  onClick,
  isActive = false 
}) => (
  <li>
    <Link href={to}>
      <a
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg hover:bg-primary-foreground/20 transition-colors ${
          isActive ? 'bg-primary-foreground/10 font-semibold' : ''
        }`}
      >
        <span className={`flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`}>
          {icon}
        </span>
        {isExpanded && <span className="truncate">{label}</span>}
      </a>
    </Link>
  </li>
);

interface CollapsibleSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (isOpen: boolean) => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const handleMouseEnter = () => !isMobileMenuOpen && setIsExpanded(true);
  const handleMouseLeave = () => !isMobileMenuOpen && setIsExpanded(false);
  const handleLogout = () => signOut();

  const sidebarWidth = isExpanded ? 'w-60' : 'w-16';

  const SidebarContent = ({ isSheet = false, closeSheet }: { isSheet?: boolean; closeSheet?: () => void }) => (
    <div className={`flex flex-col h-full ${isSheet ? 'bg-primary text-primary-foreground p-4' : ''}`}>
      {/* Logo Section */}
      <div className={`${isSheet ? 'mb-6 text-center' : 'px-4 mb-4'}`}>
        <Link href="/dashboard">
          <a onClick={closeSheet} className="flex items-center">
            <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-2 ${!isExpanded && !isSheet ? 'mx-auto mr-0' : ''}`}>
              <span className="text-primary font-bold text-sm">R</span>
            </div>
            {(isExpanded || isSheet) && (
              <span className="font-bold text-xl">ReAlign</span>
            )}
          </a>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-grow flex flex-col justify-between">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.to || 
              (item.to === '/transactions' && location.startsWith('/transactions'));
            
            if (isSheet) {
              return (
                <NavItem
                  key={item.label}
                  {...item}
                  isExpanded={true}
                  onClick={closeSheet}
                  isActive={isActive}
                />
              );
            }

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <div>
                    <NavItem
                      {...item}
                      isExpanded={isExpanded}
                      isActive={isActive}
                    />
                  </div>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" className="bg-primary text-primary-foreground border-primary-foreground/20">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </ul>

        {/* Bottom Navigation */}
        <div className="space-y-1 mt-auto pt-4 border-t border-primary-foreground/10">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = location === item.to;
              
              if (isSheet) {
                return (
                  <NavItem
                    key={item.label}
                    {...item}
                    isExpanded={true}
                    onClick={closeSheet}
                    isActive={isActive}
                  />
                );
              }

              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <div>
                      <NavItem
                        {...item}
                        isExpanded={isExpanded}
                        isActive={isActive}
                      />
                    </div>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" className="bg-primary text-primary-foreground border-primary-foreground/20">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
            
            {/* Logout */}
            {isSheet ? (
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    closeSheet?.();
                  }}
                  className="flex items-center p-3 rounded-lg hover:bg-primary-foreground/20 transition-colors w-full text-left"
                >
                  <span className="mr-3 flex-shrink-0">
                    <LogOut size={20} />
                  </span>
                  <span className="truncate">Logout</span>
                </button>
              </li>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center p-3 rounded-lg hover:bg-primary-foreground/20 transition-colors w-full"
                    >
                      <span className={`flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`}>
                        <LogOut size={20} />
                      </span>
                      {isExpanded && <span className="truncate">Logout</span>}
                    </button>
                  </li>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" className="bg-primary text-primary-foreground border-primary-foreground/20">
                    Logout
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col ${sidebarWidth} bg-primary text-primary-foreground transition-all duration-300 ease-in-out`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="text-foreground">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-primary text-primary-foreground">
          <SidebarContent isSheet={true} closeSheet={() => setIsMobileMenuOpen?.(false)} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};