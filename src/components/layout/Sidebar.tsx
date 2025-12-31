import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Eye,
  Stethoscope,
  Pill,
  Settings,
  LogOut,
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Activity,
  Loader2,
  History,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const roleNavItems: Record<AppRole, NavItem[]> = {
  reception: [
    { label: 'Dashboard', href: '/reception', icon: LayoutDashboard },
    { label: 'Register Patient', href: '/reception/register', icon: UserPlus },
    { label: 'Queue', href: '/reception/queue', icon: ClipboardList },
  ],
  eye_measurement: [
    { label: 'Waiting List', href: '/eye-measurement', icon: Eye },
  ],
  doctor: [
    { label: 'Patients', href: '/doctor', icon: Stethoscope },
    { label: 'Patient History', href: '/patient-history', icon: History },
  ],
  pharmacy: [
    { label: 'Prescriptions', href: '/pharmacy', icon: Pill },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Patient History', href: '/patient-history', icon: History },
    { label: 'Staff', href: '/admin/staff', icon: Users },
    { label: 'Medicines', href: '/admin/medicines', icon: Pill },
    { label: 'Reports', href: '/admin/reports', icon: Activity },
  ],
};

const roleIcons: Record<AppRole, React.ElementType> = {
  reception: Users,
  eye_measurement: Eye,
  doctor: Stethoscope,
  pharmacy: Pill,
  admin: Settings,
};

const roleLabels: Record<AppRole, string> = {
  reception: 'Reception',
  eye_measurement: 'Eye Measurement',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
};

export function Sidebar() {
  const { user, profile, role, logout, isLoading } = useAuth();
  const location = useLocation();

  if (!user || !role) return null;

  const navItems = roleNavItems[role] || [];
  const RoleIcon = roleIcons[role] || Users;
  
  if (navItems.length === 0) return null;
  const displayName = profile?.name || user.email || 'User';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">EyeCare</h1>
            <p className="text-xs text-sidebar-foreground/60">Clinic System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
            <RoleIcon className="w-4 h-4 text-sidebar-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-sidebar-foreground/60">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          disabled={isLoading}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          Sign Out
        </button>
      </div>
    </aside>
  );
}
