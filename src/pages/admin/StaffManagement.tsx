import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, RefreshCw, Plus, Pencil, Trash2, Loader2, Copy, Mail } from 'lucide-react';
import { useStaff, useUpdateStaffRole, StaffMember } from '@/hooks/useStaff';
import { useCreateStaff, useDeleteStaff, useUpdateStaffProfile, useResetPasswordRequest } from '@/hooks/useAdminStaff';
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

const availableRoles: AppRole[] = ['reception', 'eye_measurement', 'doctor', 'pharmacy', 'admin'];

export default function StaffManagement() {
  const { data: staff, isLoading, refetch } = useStaff();
  const updateRole = useUpdateStaffRole();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();
  const updateProfile = useUpdateStaffProfile();
  const resetPassword = useResetPasswordRequest();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'reception' as AppRole });
  const [editForm, setEditForm] = useState({ name: '', role: 'reception' as AppRole });

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ userId, newRole });
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast.error('Please fill all fields');
      return;
    }
    if (newStaff.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await createStaff.mutateAsync(newStaff);
      setCreatedCredentials({ email: newStaff.email, password: newStaff.password });
      setShowCredentials(true);
      setNewStaff({ name: '', email: '', password: '', role: 'reception' });
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create staff');
    }
  };

  const handleCopyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
      toast.success('Credentials copied to clipboard!');
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditForm({ name: member.name, role: member.role });
    setEditDialogOpen(true);
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      if (editForm.name !== selectedStaff.name) {
        await updateProfile.mutateAsync({ userId: selectedStaff.id, name: editForm.name });
      }
      if (editForm.role !== selectedStaff.role) {
        await updateRole.mutateAsync({ userId: selectedStaff.id, newRole: editForm.role });
      }
      toast.success('Staff updated!');
      setEditDialogOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      toast.error('Failed to update staff');
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      await deleteStaff.mutateAsync(selectedStaff.id);
      toast.success('Staff deactivated!');
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      toast.error('Failed to deactivate staff');
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      await resetPassword.mutateAsync(email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Staff Management" description="Create and manage clinic staff accounts">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button className="gradient-primary" size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Staff
          </Button>
        </div>
      </PageHeader>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setShowCredentials(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{showCredentials ? 'Staff Created!' : 'Add New Staff'}</DialogTitle></DialogHeader>
          {showCredentials && createdCredentials ? (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-success/10 rounded-lg">
                <p className="font-medium text-success mb-2">Account created successfully!</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Email:</span> {createdCredentials.email}</p>
                  <p><span className="text-muted-foreground">Password:</span> {createdCredentials.password}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopyCredentials} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />Copy Credentials
                </Button>
                <Button onClick={() => { setAddDialogOpen(false); setShowCredentials(false); }} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddStaff} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Dr. John Smith" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="john@clinic.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <Input type="text" placeholder="Min. 6 characters" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={createStaff.isPending}>
                {createStaff.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Staff Account
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={updateProfile.isPending || updateRole.isPending}>
                {(updateProfile.isPending || updateRole.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Staff?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedStaff?.name}'s role. They will no longer be able to access the system.
              Historical data linked to this staff will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive hover:bg-destructive/90">
              {deleteStaff.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <p className="text-sm mt-1">Add staff using the button above</p>
            </CardContent>
          </Card>
        ) : (
          staff?.map((member) => (
            <Card key={member.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{member.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={member.role}
                      onValueChange={(value: AppRole) => handleRoleChange(member.id, value)}
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className={`w-32 sm:w-40 ${roleColors[member.role]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(member)} title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleSendPasswordReset(member.email)} title="Send password reset" disabled={resetPassword.isPending}>
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => { setSelectedStaff(member); setDeleteDialogOpen(true); }} title="Deactivate">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
