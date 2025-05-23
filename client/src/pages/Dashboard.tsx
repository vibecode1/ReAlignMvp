import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Home, 
  Clock, 
  CheckCircle, 
  Plus, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { EnhancedEmptyState } from "@/components/ui/enhanced-empty-state";

interface TransactionSummary {
  id: string;
  title: string;
  property_address: string;
  currentPhase: string;
  lastActivityAt: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch transactions
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/v1/transactions'],
  });

  // Format data with type safety
  const transactions: TransactionSummary[] = (data as any)?.data || [];
  const transactionsCount = transactions.length;
  const activeTransactions = transactions.filter(t => 
    t.currentPhase !== 'In Closing'
  ).length;
  const completedTransactions = transactions.filter(t => 
    t.currentPhase === 'In Closing'
  ).length;
  
  // Recent transactions (most recent first by lastActivityAt)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, 5);

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMins < 60) {
      return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-primary">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}</p>
      </div>
      
      {/* Summary Stats - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">Total Transactions</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{transactionsCount}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">All time transactions</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Active Transactions</h3>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold">{activeTransactions}</p>
              <p className="text-gray-500 text-sm mt-1">Currently in progress</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">Completed</h3>
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold">{completedTransactions}</p>
              <p className="text-gray-500 text-sm mt-1">Transactions in closing</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Recent Transactions */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your recently active transactions</CardDescription>
          </div>
          {user?.role === 'negotiator' && (
            <Button 
              onClick={() => navigate('/transactions/new')}
              className="btn-mobile focus-enhanced"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Transaction
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Failed to load transactions</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <EnhancedEmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No transactions yet"
              description={user?.role === 'negotiator' 
                ? "Start managing real estate transactions efficiently with your first deal." 
                : "Once you're added to transactions, they'll appear here for easy tracking."
              }
              actionLabel={user?.role === 'negotiator' ? "Create Your First Transaction" : undefined}
              onAction={user?.role === 'negotiator' ? () => navigate('/transactions/new') : undefined}
            />
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div 
                    className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer btn-mobile focus-enhanced"
                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/transactions/${transaction.id}`);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{transaction.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{transaction.property_address}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {transaction.currentPhase}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last activity: {getRelativeTime(transaction.lastActivityAt)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/transactions')}
                  className="btn-mobile focus-enhanced"
                >
                  View All Transactions
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Commonly used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col btn-mobile focus-enhanced" 
              onClick={() => navigate('/transactions')}
            >
              <FileText className="h-8 w-8 mb-2" />
              <span>Manage Transactions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col btn-mobile focus-enhanced" 
              onClick={() => navigate('/document-requests')}
            >
              <Home className="h-8 w-8 mb-2" />
              <span>Document Requests</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col btn-mobile focus-enhanced" 
              onClick={() => navigate('/notifications')}
            >
              <Clock className="h-8 w-8 mb-2" />
              <span>Notification Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
