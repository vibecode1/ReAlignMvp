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
import Account from "@/pages/Account";
import AppShell from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { SolutionsPage } from "@/pages/SolutionsPage";
import { PricingPage } from "@/pages/PricingPage";
import { ContactPage } from "@/pages/ContactPage";
import { FeaturesPage } from "@/pages/FeaturesPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { HelpPage } from "@/pages/HelpPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";
import { DocumentationPage } from "@/pages/DocumentationPage";
import { GuidesPage } from "@/pages/GuidesPage";
import { ApiReferencePage } from "@/pages/ApiReferencePage";
import { SecurityPage } from "@/pages/SecurityPage";
import { CompliancePage } from "@/pages/CompliancePage";
import { CareersPage } from "@/pages/CareersPage";
import { BlogPage } from "@/pages/BlogPage";
import { BlogPostFuture } from "@/pages/BlogPostFuture";
import { MakerDashboardPage } from "@/pages/MakerDashboardPage";
import { AdvisorDashboardPage } from "@/pages/AdvisorDashboardPage";
import { MakerToolPage } from "@/pages/MakerToolPage";
import { AdvisorToolPage } from "@/pages/AdvisorToolPage";
import { TrackerLandingPage } from "@/pages/TrackerLandingPage";
import { MakerLandingPage } from "@/pages/MakerLandingPage";
import { AdvisorLandingPage } from "@/pages/AdvisorLandingPage";
import { ClaudeTestPage } from "@/pages/ClaudeTestPage";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useIsMobile } from "@/hooks/use-mobile";
import { setupFCMHandler } from "@/lib/notifications";
import { useEffect } from "react";
import UBAFormMaker from './pages/UBAFormMaker';
import UBAFormMakerEnhanced from './pages/UBAFormMakerEnhanced';

type Role = 'negotiator' | 'seller' | 'buyer' | 'listing_agent' | 'buyers_agent' | 'escrow';

// Public route component (for marketing pages)
const PublicRoute = ({ 
  component: Component,
  ...rest 
}: { 
  component: React.ComponentType<any>,
  path?: string 
}) => {
  return (
    <PublicLayout>
      <Component />
    </PublicLayout>
  );
};

// Protected route component (for authenticated app pages)
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
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public Marketing Pages */}
      <Route path="/about">
        <PublicRoute component={AboutPage} />
      </Route>
      <Route path="/solutions">
        <PublicRoute component={SolutionsPage} />
      </Route>
      <Route path="/pricing">
        <PublicRoute component={PricingPage} />
      </Route>
      <Route path="/contact">
        <PublicRoute component={ContactPage} />
      </Route>
      <Route path="/features">
        <PublicRoute component={FeaturesPage} />
      </Route>
      <Route path="/solutions/tracker">
        <PublicRoute component={TrackerLandingPage} />
      </Route>
      <Route path="/solutions/maker">
        <PublicRoute component={MakerLandingPage} />
      </Route>
      <Route path="/solutions/advisor">
        <PublicRoute component={AdvisorLandingPage} />
      </Route>
      <Route path="/integrations">
        <PublicRoute component={IntegrationsPage} />
      </Route>
      <Route path="/help">
        <PublicRoute component={HelpCenterPage} />
      </Route>
      <Route path="/docs">
        <PublicRoute component={DocumentationPage} />
      </Route>
      <Route path="/guides">
        <PublicRoute component={GuidesPage} />
      </Route>
      <Route path="/api">
        <PublicRoute component={ApiReferencePage} />
      </Route>
      <Route path="/security">
        <PublicRoute component={SecurityPage} />
      </Route>
      <Route path="/compliance">
        <PublicRoute component={CompliancePage} />
      </Route>
      <Route path="/careers">
        <PublicRoute component={CareersPage} />
      </Route>
      <Route path="/blog">
        <PublicRoute component={BlogPage} />
      </Route>
      <Route path="/blog/future-of-short-sale-coordination">
        <PublicRoute component={BlogPostFuture} />
      </Route>
      <Route path="/privacy">
        <PublicRoute component={PrivacyPage} />
      </Route>
      <Route path="/terms">
        <PublicRoute component={TermsPage} />
      </Route>
      <Route path="/">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <PublicRoute component={HomePage} />}
      </Route>

      {/* Auth Pages (with PublicLayout) */}
      <Route path="/login">
        <PublicLayout><Login /></PublicLayout>
      </Route>
      <Route path="/reset-password">
        <PublicLayout><ResetPassword /></PublicLayout>
      </Route>
      <Route path="/update-password">
        <PublicLayout><UpdatePassword /></PublicLayout>
      </Route>
      <Route path="/register">
        <PublicLayout><RegisterNegotiator /></PublicLayout>
      </Route>
      <Route path="/register/negotiator">
        <PublicLayout><RegisterNegotiator /></PublicLayout>
      </Route>
      <Route path="/magic-link">
        <PublicLayout><MagicLink /></PublicLayout>
      </Route>
      <Route path="/auth/callback">
        <PublicLayout><MagicLinkCallback /></PublicLayout>
      </Route>

      {/* Public Tracker Route (New for Tracker MVP) */}
      <Route path="/tracker/:transactionId" component={PublicTrackerView}/>

      {/* Protected App Routes */}
      <Route path="/dashboard">
        {() => {
          const { user } = useAuth();
          // Route to role-specific dashboard
          if (user?.role === 'negotiator') {
            return <ProtectedRoute component={Dashboard} />;
          } else {
            // For other roles, show a simplified dashboard or redirect to their main view
            return <ProtectedRoute component={Dashboard} />;
          }
        }}
      </Route>
      <Route path="/app/maker">
        <ProtectedRoute component={MakerDashboardPage} allowedRoles={['negotiator']} />
      </Route>
      <Route path="/app/maker/:tool/:subTool?">
        {params => <ProtectedRoute component={() => <MakerToolPage tool={params.tool} subTool={params.subTool} />} allowedRoles={['negotiator']} />}
      </Route>
      <Route path="/app/advisor">
        <ProtectedRoute component={AdvisorDashboardPage} allowedRoles={['negotiator']} />
      </Route>
      <Route path="/app/advisor/:tool/:subTool?">
        {params => <ProtectedRoute component={() => <AdvisorToolPage tool={params.tool} subTool={params.subTool} />} allowedRoles={['negotiator']} />}
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
      <Route path="/account">
        <ProtectedRoute component={Account} />
      </Route>
      <Route path="/uba-form-maker">
        <ProtectedRoute component={UBAFormMakerEnhanced} allowedRoles={['negotiator']} />
      </Route>
      <Route path="/tracker-landing" component={TrackerLandingPage} />
      <Route path="/public-tracker/:id" component={PublicTrackerView} />
      <Route path="/party/:token">
        {params => <PartyTransactionView id={params.token} />}
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