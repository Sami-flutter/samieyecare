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
} from 'lucide-react';
import { UserRole } from '@/types/clinic';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
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
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = roleNavItems[user.role as UserRole] || [];
  
  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-large z-50">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-all min-w-[60px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
