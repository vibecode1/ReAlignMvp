import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface TransactionSummary {
  id: string;
  title: string;
  property_address: string;
  currentPhase: string;
  created_at: string;
  lastActivityAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

export default function TransactionList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  
  // Fetch transactions with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/v1/transactions?page=${page}&limit=10`],
  });

  // Format data
  const transactions: TransactionSummary[] = data?.data || [];
  const pagination: PaginationInfo = data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  };
  
  // Available phases for filter
  const PHASES = [
    "Transaction Initiated",
    "Property Listed",
    "Initial Document Collection",
    "Offer Received",
    "Offer Submitted",
    "Lender Review",
    "BPO Ordered",
    "Approval Received",
    "In Closing"
  ];
  
  // Filter transactions by search term and phase
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm.trim() === "" || 
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.property_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPhase = phaseFilter === "all" || transaction.currentPhase === phaseFilter;
    
    return matchesSearch && matchesPhase;
  });

  // Format relative time with robust error handling for NaN values
  const getRelativeTime = (dateString: string) => {
    // Handle null, undefined, or empty string inputs
    if (!dateString || dateString.trim() === '') {
      return 'N/A';
    }
    
    const date = new Date(dateString);
    
    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // Handle negative differences (future dates)
    if (diffInMs < 0) {
      return 'Just now';
    }
    
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMins < 1) {
      return 'Just now';
    } else if (diffInMins < 60) {
      return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
  };
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-primary">Transactions</h1>
        <p className="text-gray-600 mt-1">Manage and view your transactions</p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {PHASES.map((phase) => (
                    <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {user?.role === 'negotiator' && (
              <Button onClick={() => navigate('/transactions/new')}>
                <Plus className="h-4 w-4 mr-1" />
                New Transaction
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {pagination.totalItems} total transaction{pagination.totalItems !== 1 ? 's' : ''}
          </CardDescription>
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
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No transactions found.</p>
              {user?.role === 'negotiator' && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/transactions/new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create a Transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="cursor-pointer"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <div className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{transaction.property_address}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.currentPhase}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Clock className="mr-1 h-3 w-3" />
                            {getRelativeTime(transaction.lastActivityAt)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0">
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.currentPage - 1) * pagination.perPage + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems} results
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousPage}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
