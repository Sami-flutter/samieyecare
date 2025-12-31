import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface RequireRoleProps {
  allowed: UserRole[];
  children: ReactNode;
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { isAuthenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length === 0) {
    return <Navigate to="/no-access" replace />;
  }

  // Admin can access everything
  if (roles.includes("admin")) {
    return <>{children}</>;
  }

  const ok = roles.some((r) => allowed.includes(r));
  if (!ok) {
    return <Navigate to={"/"} replace />;
  }

  return <>{children}</>;
}
