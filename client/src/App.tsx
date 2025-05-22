import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import MagicLink from "@/pages/MagicLink";
import Dashboard from "@/pages/Dashboard";
import TransactionList from "@/pages/TransactionList";
import TransactionView from "@/pages/TransactionView";
import NewTransaction from "@/pages/NewTransaction";
import NotificationSettings from "@/pages/NotificationSettings";
import AppShell from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";

// Protected route component
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
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
      <Route path="/magic-link" component={MagicLink}/>
      
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
        <ProtectedRoute component={NewTransaction} />
      </Route>
      <Route path="/transactions/:id">
        {params => <ProtectedRoute component={() => <TransactionView id={params.id} />} />}
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
