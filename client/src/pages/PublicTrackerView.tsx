import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, User, MapPin, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

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
  const queryClient = useQueryClient();
  
  // Extract transaction ID and token from URL
  const pathParts = location.split('/');
  const transactionId = pathParts[2];
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');

  const { data: trackerData, isLoading, error } = useQuery<PublicTrackerData>({
    queryKey: ['/api/v1/tracker', transactionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/v1/tracker/${transactionId}?token=${token}`);
      return response.json();
    },
    enabled: !!transactionId && !!token,
  });

  const unsubscribeMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/v1/tracker/${transactionId}/unsubscribe`, { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tracker', transactionId] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error || !trackerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              This access link has expired or is invalid. Please contact your negotiator for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPhaseDisplayName = (phase: string) => {
    const phaseNames: Record<string, string> = {
      'listing_agreement': 'Listing Agreement',
      'market_preparation': 'Market Preparation',
      'active_marketing': 'Active Marketing',
      'offer_received': 'Offer Received',
      'negotiation': 'Negotiation',
      'under_contract': 'Under Contract',
      'due_diligence': 'Due Diligence',
      'closing_preparation': 'Closing Preparation',
      'closed': 'Closed'
    };
    return phaseNames[phase] || phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Transaction Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated on your transaction progress
          </p>
        </motion.div>

        {/* Transaction Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6" />
                {trackerData.transaction.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{trackerData.transaction.property_address}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Current Phase:</span>
                  <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                    {getPhaseDisplayName(trackerData.transaction.current_phase)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Your Role:</span>
                  <Badge variant="outline">
                    {trackerData.subscription.party_role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No documents assigned yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
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
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No activity updates yet.
                </p>
              </div>
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
          {trackerData?.subscription?.is_subscribed && (
            <Button
              variant="outline"
              onClick={() => unsubscribeMutation.mutate()}
              disabled={unsubscribeMutation.isPending}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              {unsubscribeMutation.isPending ? 'Unsubscribing...' : 'Unsubscribe from Updates'}
            </Button>
          )}
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by ReAlign</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}