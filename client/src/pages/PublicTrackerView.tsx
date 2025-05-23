import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Home } from "lucide-react";
import { TRANSACTION_PHASES } from "@/lib/phases";

interface PublicTrackerData {
  transaction: {
    id: string;
    title: string;
    property_address: string;
    current_phase: string;
  };
  party_role: string;
  document_requests: Array<{
    id: string;
    document_name: string;
    status: string;
    requested_at: string;
    due_date?: string;
  }>;
  tracker_notes: Array<{
    id: string;
    note_text: string;
    created_at: string;
  }>;
  phase_history: Array<{
    phase_key: string;
    timestamp: string;
  }>;
  subscription_status: boolean;
}

export default function PublicTrackerView() {
  const { transactionId } = useParams();
  const [, navigate] = useLocation();
  const [data, setData] = useState<PublicTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackerData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setError('Invalid access link. Please use the link provided in your email.');
          return;
        }

        const response = await fetch(`/api/v1/tracker/${transactionId}?token=${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error?.message || 'Failed to load tracker data');
          return;
        }

        const trackerData = await response.json();
        setData(trackerData);
      } catch (err) {
        setError('Failed to connect to server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackerData();
  }, [transactionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUnsubscribe = async () => {
    // TODO: Implement unsubscribe functionality
    alert('Unsubscribe functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracker information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const currentPhase = PHASES.find(p => p.key === data.transaction.current_phase);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Tracker</h1>
          <p className="text-gray-600">Track your short sale transaction progress</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{data.transaction.title}</h3>
              <p className="text-gray-600">{data.transaction.property_address}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm font-medium">Current Phase:</span>
                <Badge variant="secondary" className="text-sm">
                  {currentPhase?.name || data.transaction.current_phase}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Your Role:</span>
                <Badge variant="outline" className="text-sm">
                  {data.party_role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Document Status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.document_requests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No documents have been requested from you yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.document_requests.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-gray-500">
                          Requested: {formatDate(doc.requested_at)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {data.tracker_notes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No updates available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.tracker_notes.slice(0, 10).map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <p className="text-gray-900">{note.note_text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Progress Updates</p>
                <p className="text-sm text-gray-600">
                  Receive weekly summaries of your transaction progress
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={data.subscription_status ? "default" : "secondary"}>
                  {data.subscription_status ? "Subscribed" : "Unsubscribed"}
                </Badge>
                {data.subscription_status && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnsubscribe}
                  >
                    Unsubscribe
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}