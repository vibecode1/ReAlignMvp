import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import RegisterNegotiator from "@/pages/RegisterNegotiator";
import MagicLink from "@/pages/MagicLink";
import MagicLinkCallback from "@/pages/MagicLinkCallback";
import Dashboard from "@/pages/Dashboard";
import TransactionList from "@/pages/TransactionList";
import TransactionView from "@/pages/TransactionView";
import PartyTransactionView from "@/pages/PartyTransactionView";
import NewTransaction from "@/pages/NewTransaction";
import NotificationSettings from "@/pages/NotificationSettings";
import PublicTrackerView from "@/pages/PublicTrackerView";
import AppShell from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useIsMobile } from "@/hooks/use-mobile";
import { setupFCMHandler } from "@/lib/notifications";
import { useEffect } from "react";

type Role = 'negotiator' | 'seller' | 'buyer' | 'listing_agent' | 'buyers_agent' | 'escrow';

// Protected route component
const ProtectedRoute = ({ 
  component: Component, 
  allowedRoles = [], 
  ...rest 
}: { 
  component: React.ComponentType<any>, 
  allowedRoles?: Role[],
  path?: string 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAccess } = useRoleAccess(allowedRoles);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }
  
  // Not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  // Authenticated but not authorized (wrong role)
  if (allowedRoles.length > 0 && !hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center flex-col p-4">
        <div className="text-red-500 mb-4 text-xl">Access Denied</div>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          You don't have permission to access this page. This feature requires a different role.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    );
  }
  
  // All checks passed
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
};

// Router component
function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login}/>
      <Route path="/reset-password" component={ResetPassword}/>
      <Route path="/update-password" component={UpdatePassword}/>
      <Route path="/register/negotiator" component={RegisterNegotiator}/>
      <Route path="/magic-link" component={MagicLink}/>
      <Route path="/auth/callback" component={MagicLinkCallback}/>
      
      {/* Public Tracker Route (New for Tracker MVP) */}
      <Route path="/tracker/:transactionId" component={PublicTrackerView}/>
      
      {/* Protected routes */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={TransactionList} />
      </Route>
      <Route path="/transactions/new">
        <ProtectedRoute 
          component={NewTransaction} 
          allowedRoles={['negotiator']} 
        />
      </Route>
      <Route path="/transactions/:id">
        {params => {
          // Check if the user is a negotiator or other party role to show the appropriate view
          const PartyViewWrapper = () => {
            const { user } = useAuth();
            const isMobile = useIsMobile();
            
            if (user?.role === 'negotiator') {
              return <TransactionView id={params.id} />;
            } else {
              // For party roles, show the specialized party view
              return <PartyTransactionView id={params.id} />;
            }
          };
          
          return <ProtectedRoute component={PartyViewWrapper} />;
        }}
      </Route>
      <Route path="/party-view/:id">
        {params => (
          <ProtectedRoute 
            component={() => <PartyTransactionView id={params.id} />}
            allowedRoles={['seller', 'buyer', 'listing_agent', 'buyers_agent', 'escrow']} 
          />
        )}
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationSettings} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize Firebase Cloud Messaging handler when app starts
    setupFCMHandler();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
