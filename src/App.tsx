import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Stock from "./pages/Stock";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Loyalty from "./pages/Loyalty";
import Accounting from "./pages/Accounting";
import Integrations from "./pages/Integrations";
import Users from "./pages/Users";
import ActivityLogs from "./pages/ActivityLogs";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/billing" replace />} />
            <Route path="/stock" element={
              <ProtectedRoute module="stock">
                <Stock />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute module="billing">
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute module="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute module="customers">
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/loyalty" element={
              <ProtectedRoute module="loyalty">
                <Loyalty />
              </ProtectedRoute>
            } />
            <Route path="/accounting" element={
              <ProtectedRoute module="accounting">
                <Accounting />
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute module="integrations">
                <Integrations />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute module="settings">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute module="users">
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/activity" element={
              <ProtectedRoute module="dashboard">
                <ActivityLogs />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
