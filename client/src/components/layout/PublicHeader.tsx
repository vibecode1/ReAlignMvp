import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, ChevronDown, Target, Wrench, GraduationCap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navigationItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/contact', label: 'Contact' },
  ];

  const modules = [
    {
      href: '/solutions/tracker',
      name: 'Tracker',
      icon: <Target className="h-4 w-4" />,
    },
    {
      href: '/solutions/maker',
      name: 'Maker',
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      href: '/solutions/advisor',
      name: 'Advisor',
      icon: <GraduationCap className="h-4 w-4" />,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${
                isActiveLink(item.href)
                  ? 'text-foreground'
                  : 'text-foreground/60'
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Products Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 transition-colors hover:text-foreground/80 text-foreground/60 hover:text-foreground cursor-pointer">
              <span>Products</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {modules.map((module) => (
                <DropdownMenuItem key={module.href} asChild>
                  <Link href={module.href} className="flex items-center space-x-3 p-3 cursor-pointer">
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">ReAlign {module.name}</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur"
          >
            <nav className="container px-4 py-4 space-y-2">
              {/* Main Navigation */}
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-2 text-sm transition-colors hover:text-foreground/80 ${
                    isActiveLink(item.href)
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Modules Section */}
              <div className="space-y-2">
                {modules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="block py-2 text-sm text-muted-foreground transition-colors hover:text-foreground/80"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {module.name}
                  </Link>
                ))}
                
                {/* Sign In Link */}
                <Link
                  href="/login"
                  className="block py-2 text-sm text-muted-foreground transition-colors hover:text-foreground/80"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
              
              {/* Mobile CTA Button */}
              <div className="pt-6 pb-8">
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};