import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, RefreshCw } from 'lucide-react';
import { useStaff, useUpdateStaffRole } from '@/hooks/useStaff';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type AppRole = Database['public']['Enums']['app_role'];

const roleLabels: Record<AppRole, string> = {
  reception: 'Reception',
  eye_measurement: 'Eye Measurement',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  admin: 'Admin',
};

const roleColors: Record<AppRole, string> = {
  reception: 'bg-info/10 text-info',
  eye_measurement: 'bg-primary/10 text-primary',
  doctor: 'bg-success/10 text-success',
  pharmacy: 'bg-accent/20 text-accent-foreground',
  admin: 'bg-destructive/10 text-destructive',
};

export default function StaffManagement() {
  const { data: staff, isLoading, refetch } = useStaff();
  const updateRole = useUpdateStaffRole();

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ userId, newRole });
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  return (
    <AppShell>
      <PageHeader 
        title="Staff Management" 
        description="View and manage clinic staff roles"
      >
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-36" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : staff?.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No staff members found</p>
              <p className="text-sm mt-1">Staff accounts will appear here after they sign up</p>
            </CardContent>
          </Card>
        ) : (
          staff?.map((member) => (
            <Card key={member.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{member.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <Select
                    value={member.role}
                    onValueChange={(value: AppRole) => handleRoleChange(member.id, value)}
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className={`w-40 ${roleColors[member.role]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-6 border-dashed shadow-soft">
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">
            💡 New staff members can sign up at the login page with their assigned role
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
