import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

const roleRoutes: Record<AppRole, string> = {
  reception: '/reception',
  eye_measurement: '/eye-measurement',
  doctor: '/doctor',
  pharmacy: '/pharmacy',
  admin: '/admin',
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user's role is allowed for this route
  if (!allowedRoles.includes(role)) {
    // Redirect to their correct dashboard
    return <Navigate to={roleRoutes[role]} replace />;
  }

  return <>{children}</>;
}
