import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  requiredAction?: 'view' | 'create' | 'edit' | 'delete';
  superAdminOnly?: boolean;
}

export function ProtectedRoute({ children, module, requiredAction = 'view', superAdminOnly }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, role, business, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/billing" replace />;
  }

  // Super admins bypass business checks
  if (!isSuperAdmin) {
    // Check if business is whitelisted
    if (business && !business.is_whitelisted) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 bg-card rounded-2xl shadow-card max-w-md border border-border">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Pending Approval</h2>
            <p className="text-muted-foreground mb-4">
              Your business is pending approval from the platform administrator. You'll be notified once your account is activated.
            </p>
            <a href="/auth" className="text-primary hover:underline text-sm">Sign out and try later</a>
          </div>
        </div>
      );
    }

    // Cashiers cannot access stock module
    if (role === 'cashier' && module === 'stock') {
      return <Navigate to="/billing" replace />;
    }

    // Check permissions
    if (module && !hasPermission(module, requiredAction)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 bg-card rounded-2xl shadow-card max-w-md border border-border">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <a href="/" className="text-primary hover:underline">Go to Home</a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
