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

  const products = [
    {
      href: '/solutions/tracker',
      name: 'ReAlign Tracker',
      description: 'Transaction Management',
      icon: <Target className="h-4 w-4" />,
    },
    {
      href: '/solutions/maker',
      name: 'ReAlign Maker',
      description: 'Document Creation',
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      href: '/solutions/advisor',
      name: 'ReAlign Advisor',
      description: 'Education & Guidance',
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
            <DropdownMenuContent align="start" className="w-80">
              {products.map((product) => (
                <DropdownMenuItem key={product.href} asChild>
                  <Link href={product.href} className="flex items-start space-x-3 p-3 cursor-pointer">
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                      {product.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/pricing" className="flex items-center space-x-2 p-3 cursor-pointer">
                  <Package className="h-4 w-4" />
                  <span className="font-medium text-sm">Compare Plans & Bundles</span>
                </Link>
              </DropdownMenuItem>
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

      {/* Enhanced Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 md:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Drawer Content */}
            <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl">
              <div className="flex h-full flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Logo className="h-8 w-auto" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">ReAlign</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation Content */}
                <nav className="flex-1 px-6 py-6 space-y-6">
                  {/* Primary Navigation Section */}
                  <div className="space-y-3">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block py-3 px-3 rounded-lg text-base font-medium transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          isActiveLink(item.href)
                            ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Products Section */}
                  <div className="space-y-4">
                    {/* Section Header */}
                    <div className="px-3">
                      <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                        Products
                      </h3>
                    </div>
                    
                    {/* Products Background Container */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                      {products.map((product) => (
                        <Link
                          key={product.href}
                          href={product.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 py-3 px-3 rounded-lg transition-colors duration-200 hover:bg-white dark:hover:bg-gray-700 group"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                            {React.cloneElement(product.icon, { className: "h-4 w-4 text-gray-600 dark:text-gray-300" })}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{product.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{product.description}</div>
                          </div>
                        </Link>
                      ))}
                      
                      {/* Compare Plans & Bundles */}
                      <Link
                        href="/pricing"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 py-3 px-3 rounded-lg transition-colors duration-200 hover:bg-white dark:hover:bg-gray-700 group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <Package className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">Compare Plans & Bundles</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </nav>

                {/* Action Buttons Section */}
                <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      variant="ghost" 
                      size="lg" 
                      className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};