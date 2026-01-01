import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, DollarSign, Search, ArrowRight, Loader2, Printer } from 'lucide-react';
import { usePatients, useSearchPatients } from '@/hooks/usePatients';
import { useTodayVisits, useCreateVisit, VisitWithPatient } from '@/hooks/useVisits';
import { useDoctors } from '@/hooks/useDoctors';
import { usePrint } from '@/hooks/usePrint';
import { ReceptionSlip } from '@/components/print/ReceptionSlip';
import { toast } from 'sonner';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: todayVisits = [], isLoading: visitsLoading } = useTodayVisits();
  const { data: searchResults = [] } = useSearchPatients(searchQuery);
  const { data: doctors = [] } = useDoctors();
  const createVisitMutation = useCreateVisit();
  const { printElement } = usePrint();

  // Visit creation dialog state
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Print state
  const [printSlipData, setPrintSlipData] = useState<{
    patientName: string;
    tokenNumber: number;
    doctorName: string;
    roomNumber: string;
  } | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

  const waitingCount = todayVisits.filter(v => v.status === 'waiting').length;
  const totalIncome = todayVisits.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0);

  // Open visit creation dialog
  const openVisitDialog = (patient: { id: string; name: string }) => {
    setSelectedPatient(patient);
    setSelectedDoctorId('');
    setRoomNumber('');
    setVisitDialogOpen(true);
  };

  // Handle doctor selection - auto-fill room if needed
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    // Could auto-fill room based on doctor's default room if we had that data
    // For now, user can manually enter
  };

  // Create visit with doctor and room
  const handleCreateVisit = async (shouldPrint: boolean = false) => {
    if (!selectedPatient) return;

    setIsCreating(true);
    try {
      const visit = await createVisitMutation.mutateAsync({
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId || undefined,
        roomNumber: roomNumber || undefined,
      });

      const doctorName = doctors.find(d => d.id === selectedDoctorId)?.name || 'Not Assigned';

      if (shouldPrint) {
        // Prepare print data
        setPrintSlipData({
          patientName: selectedPatient.name,
          tokenNumber: visit.queue_number,
          doctorName,
          roomNumber: roomNumber || 'N/A',
        });
        setTimeout(() => {
          printElement(printSlipRef.current);
        }, 100);
      }

      toast.success(`Visit created! Queue #${visit.queue_number}`);
      setVisitDialogOpen(false);
      setSelectedPatient(null);
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to create visit');
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = patientsLoading || visitsLoading;

  return (
    <AppShell>
      <PageHeader 
        title="Reception Dashboard" 
        description="Manage patient registrations and queue"
      >
        <Button onClick={() => navigate('/reception/register')} className="gradient-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          New Patient
        </Button>
      </PageHeader>

      {/* Hidden print slip */}
      <div className="hidden">
        {printSlipData && (
          <ReceptionSlip
            ref={printSlipRef}
            date={new Date()}
            patientName={printSlipData.patientName}
            tokenNumber={printSlipData.tokenNumber}
            doctorName={printSlipData.doctorName}
            roomNumber={printSlipData.roomNumber}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Patients"
          value={isLoading ? '...' : patients.length}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Today's Visits"
          value={isLoading ? '...' : todayVisits.length}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Waiting"
          value={isLoading ? '...' : waitingCount}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Today's Income"
          value={isLoading ? '...' : `$${totalIncome.toFixed(0)}`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Quick Search */}
      <Card className="mb-8 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Quick Visit Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patient by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="mt-3 border rounded-lg divide-y">
              {searchResults.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone} · {patient.age}y · {patient.gender}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => openVisitDialog({ id: patient.id, name: patient.name })} 
                    className="gradient-primary"
                  >
                    Create Visit
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="mt-3 p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
              No patients found. <button onClick={() => navigate('/reception/register')} className="text-primary font-medium">Register new patient?</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Queue */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's Queue</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/reception/queue')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : todayVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No visits today yet. Create a visit to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {todayVisits.slice(0, 5).map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {visit.queue_number}
                    </div>
                    <div>
                      <p className="font-medium">{visit.patients?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.patients?.phone}
                        {visit.doctor && ` · Dr. ${visit.doctor.name}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={visit.status as any} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Creation Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Visit</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedPatient.name}</p>
              </div>

              <div className="space-y-2">
                <Label>Assign Doctor</Label>
                <Select value={selectedDoctorId} onValueChange={handleDoctorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  placeholder="e.g., Room 1, 2A..."
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateVisit(false)} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Visit
            </Button>
            <Button onClick={() => handleCreateVisit(true)} className="gradient-primary" disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Printer className="w-4 h-4 mr-2" />
              Create & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
