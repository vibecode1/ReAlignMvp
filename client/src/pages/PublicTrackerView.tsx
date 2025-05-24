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
      return response.json() as PublicTrackerData;
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-5 w-5 text-brand-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Transaction Tracker
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {trackerData.transaction.property_address}
          </p>
          <Badge variant="outline" className="mt-2">
            {trackerData.subscription.party_role.replace('_', ' ').toUpperCase()} VIEW
          </Badge>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Phase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Current Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PHASE_CONFIG.map((phase, index) => (
                    <div
                      key={phase.key}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        index === currentPhaseIndex
                          ? 'bg-brand-primary/10 border-l-4 border-brand-primary'
                          : index < currentPhaseIndex
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === currentPhaseIndex
                            ? 'bg-brand-primary'
                            : index < currentPhaseIndex
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          index === currentPhaseIndex
                            ? 'font-semibold text-brand-primary'
                            : index < currentPhaseIndex
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {phase.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trackerData.documentRequests.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No documents assigned to your role yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackerData.documentRequests.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.document_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(doc.status)}
                              <Badge
                                variant="secondary"
                                className={getStatusColor(doc.status)}
                              >
                                {doc.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                            {getDaysAgo(doc.requested_at)} days ago
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tracker Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trackerData.trackerNotes.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No activity updates yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {trackerData.trackerNotes.map((note, index) => (
                      <div key={note.id}>
                        <div className="flex justify-between items-start">
                          <p className="text-gray-900 dark:text-white">{note.note_text}</p>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0">
                            {getDaysAgo(note.created_at)} days ago
                          </span>
                        </div>
                        {index < trackerData.trackerNotes.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

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