import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const roleRoutes: Record<UserRole, string> = {
  reception: "/reception",
  eye_measurement: "/eye-measurement",
  doctor: "/doctor",
  pharmacy: "/pharmacy",
  admin: "/admin",
};

export default function HomeRedirect() {
  const { isAuthenticated, isLoading, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    if (roles.length === 0) {
      navigate("/no-access", { replace: true });
      return;
    }

    const primaryRole = roles[0];
    const target = roleRoutes[primaryRole] || "/reception";
    navigate(target, { replace: true });
  }, [isAuthenticated, isLoading, roles, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting…</div>
    </div>
  );
}
