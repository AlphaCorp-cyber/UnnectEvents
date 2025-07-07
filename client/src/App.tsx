import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import EventDetails from "@/pages/event-details";
import CreateEvent from "@/pages/create-event";
import MyEvents from "@/pages/my-events";
import Profile from "@/pages/profile";
import SavedEvents from "@/pages/saved-events";
import SearchPage from "@/pages/search";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/event/:id" component={EventDetails} />
          <Route path="/create-event" component={CreateEvent} />
          <Route path="/my-events" component={MyEvents} />
          <Route path="/profile" component={Profile} />
          <Route path="/saved-events" component={SavedEvents} />
          <Route path="/search" component={SearchPage} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-setup" component={AdminSetup} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="unnect-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;