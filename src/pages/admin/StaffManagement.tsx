import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield } from 'lucide-react';

// Mock staff data - in real app this would come from backend
const STAFF = [
  { id: '1', name: 'Sarah Johnson', email: 'reception@clinic.com', role: 'reception' },
  { id: '2', name: 'Mike Chen', email: 'measurement@clinic.com', role: 'eye_measurement' },
  { id: '3', name: 'Dr. Emily Watson', email: 'doctor@clinic.com', role: 'doctor' },
  { id: '4', name: 'James Miller', email: 'pharmacy@clinic.com', role: 'pharmacy' },
  { id: '5', name: 'Admin User', email: 'admin@clinic.com', role: 'admin' },
];

const roleLabels: Record<string, string> = {
  reception: 'Reception',
  eye_measurement: 'Eye Measurement',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
};

const roleColors: Record<string, string> = {
  reception: 'bg-info/10 text-info',
  eye_measurement: 'bg-primary/10 text-primary',
  doctor: 'bg-success/10 text-success',
  pharmacy: 'bg-accent/20 text-accent-foreground',
  admin: 'bg-destructive/10 text-destructive',
};

export default function StaffManagement() {
  return (
    <AppShell>
      <PageHeader 
        title="Staff Management" 
        description="View and manage clinic staff"
      />

      <div className="grid gap-4">
        {STAFF.map((staff) => (
          <Card key={staff.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {staff.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{staff.name}</h3>
                  <p className="text-sm text-muted-foreground">{staff.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[staff.role]}`}>
                  {roleLabels[staff.role]}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed shadow-soft">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Staff management requires backend integration</p>
          <p className="text-sm mt-1">Connect to Lovable Cloud to add and manage staff accounts</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
