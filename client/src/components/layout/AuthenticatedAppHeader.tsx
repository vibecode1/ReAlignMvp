import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthenticatedAppHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/transactions', label: 'Tracker' },
    { href: '/maker', label: 'Maker' },
    { href: '/advisor', label: 'Advisor' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location === '/dashboard' || location === '/';
    }
    return location.startsWith(href);
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`auth-nav-item ${
                isActiveLink(item.href) ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/account">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/notifications">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-10 w-10"
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo className="h-6 w-auto" />
                  ReAlign
                </SheetTitle>
                <SheetDescription className="text-left">
                  Navigate your workspace
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-8 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block w-full text-left auth-nav-item ${
                        isActiveLink(item.href) ? 'active' : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Menu Actions */}
                <div className="pt-4 space-y-2 border-t border-border">
                  <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link href="/notifications" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};