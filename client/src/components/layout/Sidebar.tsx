import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  FileText, 
  Users, 
  FilePlus2, 
  Bell,
  MessageCircle,
  LogOut,
  Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isMobile = false, 
  isOpen: controlledIsOpen, 
  onToggle 
}) => {
  const [location] = useLocation();
  const { signOut, user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleSidebar = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const items = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Transactions',
      href: '/transactions',
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: 'Notifications',
      href: '/notifications',
    },
  ];

  const sidebarVariants = {
    open: { width: isMobile ? '100%' : '16rem', opacity: 1 },
    closed: { width: isMobile ? '0' : '4rem', opacity: isMobile ? 0 : 1 },
  };

  return (
    <>

      <motion.aside
        variants={sidebarVariants}
        initial={isMobile ? 'closed' : 'open'}
        animate={isOpen ? 'open' : 'closed'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed top-0 left-0 z-40 h-full bg-[#263b75] text-white overflow-hidden
          ${isMobile ? 'shadow-xl' : ''}
        `}
      >
        <div className="p-4 lg:p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 whitespace-nowrap overflow-hidden">
              <span className="text-xl font-bold">ReAlign</span>
            </div>
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="text-white hover:bg-white hover:bg-opacity-10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`
                    flex items-center p-2 rounded-lg transition-all cursor-pointer
                    ${location === item.href 
                      ? 'bg-white bg-opacity-20' 
                      : 'hover:bg-white hover:bg-opacity-10'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  {isOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-3 whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* User Section & Logout - moved to mobile nav */}
          {isOpen && user && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="border-t border-white border-opacity-20 pt-4">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                    <span className="text-sm font-medium">{user.name?.[0] || 'U'}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-white text-opacity-70">{user.role}</p>
                  </div>
                </div>

                {/* Logout button in sidebar for mobile */}
                <Button 
                  variant="ghost" 
                  className="w-full text-white hover:bg-white hover:bg-opacity-10 justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;