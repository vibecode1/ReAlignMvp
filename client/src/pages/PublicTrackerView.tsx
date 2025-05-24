import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, AlertCircle, Home, Calendar, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { PHASE_CONFIG } from '@/lib/phases';
import { PublicTrackerSkeleton } from '@/components/ui/mobile-skeleton';

interface PublicTrackerData {
  transaction: {
    id: string;
    title: string;
    property_address: string;
    current_phase: string;
  };
  subscription: {
    id: string;
    party_role: string;
    is_subscribed: boolean;
  };
  documentRequests: Array<{
    id: string;
    document_name: string;
    status: string;
    requested_at: string;
    due_date?: string;
  }>;
  trackerNotes: Array<{
    id: string;
    note_text: string;
    created_at: string;
  }>;
  phaseHistory: Array<{
    id: string;
    phase_key: string;
    created_at: string;
  }>;
}

export default function PublicTrackerView() {
  const [location] = useLocation();
  const [transactionId, setTransactionId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Extract transaction ID from URL path
    const pathParts = location.split('/');
    const trackerIndex = pathParts.indexOf('tracker');
    if (trackerIndex !== -1 && pathParts[trackerIndex + 1]) {
      setTransactionId(pathParts[trackerIndex + 1]);
    }

    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Access token is missing. Please check your link.');
    }
  }, [location]);

  const { data: trackerData, isLoading, error: queryError } = useQuery({
    queryKey: ['/api/v1/tracker', transactionId, token],
    queryFn: async () => {
      if (!transactionId || !token) return null;
      
      const response = await fetch(`/api/v1/tracker/${transactionId}?token=${token}`);
      if (!response.ok) {
        throw new Error('Failed to load tracker data');
      }
      return response.json();
    },
    enabled: !!transactionId && !!token,
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/v1/tracker/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }
      return response.json();
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getDaysAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 'N/A';
    }
  };

  if (error || queryError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              {error || 'This access link has expired or is invalid. Please contact your negotiator for a new link.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <PublicTrackerSkeleton />;
  }

  if (!trackerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              No tracker data available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPhaseIndex = PHASE_CONFIG.findIndex(phase => phase.key === trackerData.transaction.current_phase);

  const currentPhase = PHASE_CONFIG.find(phase => phase.key === trackerData.transaction.current_phase);
  const daysInCurrentPhase = trackerData.phaseHistory.length > 0 
    ? getDaysAgo(trackerData.phaseHistory[trackerData.phaseHistory.length - 1].created_at) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header - Property Address Prominently */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="text-center mb-4">
            <Home className="h-6 w-6 text-brand-primary mx-auto mb-2" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {trackerData.transaction.property_address}
            </h1>
            <Badge variant="outline" className="text-xs">
              {trackerData.subscription.party_role.replace('_', ' ').toUpperCase()} VIEW
            </Badge>
          </div>

          {/* Current Status Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Phase</p>
              <h2 className="text-lg font-semibold text-brand-primary mb-2">
                {currentPhase?.name || trackerData.transaction.current_phase}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Days in current phase: <span className="font-medium">{daysInCurrentPhase}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phase Progression Display - Mobile First */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Transaction Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {PHASE_CONFIG.map((phase, index) => (
                  <div
                    key={phase.key}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                      index === currentPhaseIndex
                        ? 'bg-brand-primary/10 border-l-4 border-brand-primary shadow-sm'
                        : index < currentPhaseIndex
                        ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {index < currentPhaseIndex ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : index === currentPhaseIndex ? (
                        <div className="w-5 h-5 rounded-full bg-brand-primary animate-pulse" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium leading-relaxed ${
                          index === currentPhaseIndex
                            ? 'text-brand-primary'
                            : index < currentPhaseIndex
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {phase.name}
                      </p>
                      {index === currentPhaseIndex && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Currently in progress
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Status - Mobile-First Card Design */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Documents Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackerData.documentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No documents assigned to your role yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Sort by status: overdue and pending first */}
                  {trackerData.documentRequests
                    .sort((a: any, b: any) => {
                      const statusOrder = { 'overdue': 0, 'pending': 1, 'complete': 2 };
                      return (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
                             (statusOrder[b.status as keyof typeof statusOrder] || 3);
                    })
                    .map((doc: any) => (
                    <div
                      key={doc.id}
                      className={`border rounded-lg p-4 ${
                        doc.status === 'overdue' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : doc.status === 'pending'
                          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                          : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {doc.document_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Requested {getDaysAgo(doc.requested_at)} days ago
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusIcon(doc.status)}
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(doc.status)} text-xs font-medium`}
                          >
                            {doc.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {doc.status === 'pending' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Days pending: <span className="font-medium">{getDaysAgo(doc.requested_at)}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tracker Notes / Activity Updates - Recent Week Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackerData.trackerNotes.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No activity updates yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackerData.trackerNotes
                    .slice(0, 5) // Show recent notes first
                    .map((note: any, index: number) => (
                    <div 
                      key={note.id}
                      className="border-l-4 border-brand-primary/30 pl-4 py-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <p className="text-gray-900 dark:text-white leading-relaxed text-sm">
                          {note.note_text}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {index < Math.min(trackerData.trackerNotes.length, 5) - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                  
                  {trackerData.trackerNotes.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" size="sm" className="text-xs">
                        View Older Updates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          {trackerData.subscription.is_subscribed && (
            <Button
              variant="outline"
              onClick={() => unsubscribeMutation.mutate()}
              disabled={unsubscribeMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              {unsubscribeMutation.isPending ? 'Unsubscribing...' : 'Unsubscribe from Updates'}
            </Button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Powered by ReAlign • Short Sale Transaction Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}