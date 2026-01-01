import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Eye,
  Stethoscope,
  Pill,
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  Activity,
  LogOut,
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
    { label: 'Home', href: '/reception', icon: LayoutDashboard },
    { label: 'Register', href: '/reception/register', icon: UserPlus },
    { label: 'Queue', href: '/reception/queue', icon: ClipboardList },
  ],
  eye_measurement: [
    { label: 'Patients', href: '/eye-measurement', icon: Eye },
  ],
  doctor: [
    { label: 'Patients', href: '/doctor', icon: Stethoscope },
    { label: 'History', href: '/patient-history', icon: History },
  ],
  pharmacy: [
    { label: 'Rx', href: '/pharmacy', icon: Pill },
  ],
  admin: [
    { label: 'Home', href: '/admin', icon: LayoutDashboard },
    { label: 'Staff', href: '/admin/staff', icon: Users },
    { label: 'Meds', href: '/admin/medicines', icon: Pill },
    { label: 'Reports', href: '/admin/reports', icon: Activity },
  ],
};

export function MobileNav() {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  if (!user || !role) return null;

  const navItems = roleNavItems[role] || [];
  
  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-large z-50 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all min-w-[56px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-all min-w-[56px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
