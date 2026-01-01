import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useTodayVisits, useUpdateVisitStatus, useRecordPayment, VisitStatus } from '@/hooks/useVisits';
import { useDoctors } from '@/hooks/useDoctors';
import { useUpdateVisitAssignment } from '@/hooks/useUpdateVisitAssignment';
import { usePrint } from '@/hooks/usePrint';
import { ReceptionSlip } from '@/components/print/ReceptionSlip';
import { toast } from 'sonner';
import { DollarSign, Send, CheckCircle, Loader2, Printer, User, MapPin, AlertTriangle, Edit } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export default function QueueManagement() {
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const { data: doctors = [] } = useDoctors();
  const updateStatusMutation = useUpdateVisitStatus();
  const recordPaymentMutation = useRecordPayment();
  const updateAssignmentMutation = useUpdateVisitAssignment();
  const { printElement } = usePrint();
  
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Edit assignment dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editVisitId, setEditVisitId] = useState<string | null>(null);
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  
  // Print slip state - always render for ref stability
  const [printSlipData, setPrintSlipData] = useState<{
    patientName: string;
    tokenNumber: number;
    doctorName: string;
    roomNumber: string;
  } | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const printSlipRef = useRef<HTMLDivElement>(null);

  // Effect to handle printing after state updates
  useEffect(() => {
    if (shouldPrint && printSlipData && printSlipRef.current) {
      printElement(printSlipRef.current);
      setShouldPrint(false);
    }
  }, [shouldPrint, printSlipData, printElement]);

  const handleRecordPayment = async () => {
    if (!selectedVisit || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }
    
    try {
      await recordPaymentMutation.mutateAsync({
        visitId: selectedVisit,
        paymentMethod,
        paymentAmount: parseFloat(paymentAmount),
      });
      toast.success('Payment recorded successfully!');
      setDialogOpen(false);
      setPaymentAmount('');
      setSelectedVisit(null);
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleSendToMeasurement = async (visitId: string) => {
    try {
      await updateStatusMutation.mutateAsync({ visitId, status: 'eye_measurement' });
      toast.success('Patient sent to Eye Measurement');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Check if visit is missing doctor or room
  const isVisitIncomplete = (visit: typeof todayVisits[0]) => {
    return !visit.doctor?.id || !(visit as any).room_number;
  };

  // Open edit assignment dialog
  const openEditDialog = (visit: typeof todayVisits[0]) => {
    setEditVisitId(visit.id);
    setEditDoctorId(visit.doctor?.id || '');
    setEditRoomNumber((visit as any).room_number || '');
    setEditDialogOpen(true);
  };

  // Save assignment
  const handleSaveAssignment = async () => {
    if (!editVisitId || !editDoctorId || !editRoomNumber) {
      toast.error('Doctor and room are required');
      return;
    }

    try {
      await updateAssignmentMutation.mutateAsync({
        visitId: editVisitId,
        doctorId: editDoctorId,
        roomNumber: editRoomNumber,
      });
      toast.success('Assignment updated successfully!');
      setEditDialogOpen(false);
      setEditVisitId(null);
    } catch (error) {
      toast.error('Failed to update assignment');
    }
  };

  const handlePrintSlip = (visit: typeof todayVisits[0]) => {
    // Guard: don't print if missing doctor or room
    if (isVisitIncomplete(visit)) {
      toast.error('Assign doctor and room before printing');
      return;
    }

    const doctorName = visit.doctor?.name || 'Not Assigned';
    const roomNumber = (visit as any).room_number || 'N/A';
    
    setPrintSlipData({
      patientName: visit.patients?.name || 'Unknown',
      tokenNumber: visit.queue_number,
      doctorName: `Dr. ${doctorName}`,
      roomNumber,
    });
    
    // Trigger print in next render cycle
    setTimeout(() => setShouldPrint(true), 150);
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Queue Management" description="View and manage today's patient queue" />
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader 
        title="Queue Management" 
        description="View and manage today's patient queue"
      />

      {/* Hidden print slip - always rendered for ref stability */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ReceptionSlip
          ref={printSlipRef}
          date={new Date()}
          patientName={printSlipData?.patientName || ''}
          tokenNumber={printSlipData?.tokenNumber || 0}
          doctorName={printSlipData?.doctorName || ''}
          roomNumber={printSlipData?.roomNumber || ''}
        />
      </div>

      {/* Edit Assignment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select value={editDoctorId} onValueChange={setEditDoctorId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No doctors available - add via Staff Management
                    </SelectItem>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {doctors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No doctors found. Add staff with "Doctor" role in Staff Management.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Room Number *</Label>
              <Input
                placeholder="e.g., Room 1, 2A..."
                value={editRoomNumber}
                onChange={(e) => setEditRoomNumber(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAssignment}
              disabled={updateAssignmentMutation.isPending || !editDoctorId || !editRoomNumber}
              className="gradient-primary"
            >
              {updateAssignmentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {todayVisits.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              No visits today. Register a patient to create a visit.
            </CardContent>
          </Card>
        ) : (
          todayVisits.map((visit) => {
            const incomplete = isVisitIncomplete(visit);
            return (
            <Card key={visit.id} className={`shadow-soft hover:shadow-medium transition-shadow ${incomplete ? 'border-destructive/50' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  {/* Incomplete visit warning */}
                  {incomplete && (
                    <div className="flex items-center justify-between p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Incomplete visit — assign doctor & room</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => openEditDialog(visit)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Assign Now
                      </Button>
                    </div>
                  )}

                  {/* Main info row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Queue Number */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                        {visit.queue_number}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{visit.patients?.name || 'Unknown'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {visit.patients?.phone} · {visit.patients?.age}y · {visit.patients?.gender}
                        </p>
                      </div>
                    </div>

                    {/* Doctor and Room info */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className={`flex items-center gap-1.5 ${!visit.doctor?.id ? 'text-destructive' : ''}`}>
                        <User className="w-4 h-4" />
                        <span>{visit.doctor?.name ? `Dr. ${visit.doctor.name}` : 'No doctor'}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${!(visit as any).room_number ? 'text-destructive' : ''}`}>
                        <MapPin className="w-4 h-4" />
                        <span>{(visit as any).room_number ? `Room ${(visit as any).room_number}` : 'No room'}</span>
                      </div>
                      {!incomplete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(visit)}
                          className="h-7 px-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto">
                      <StatusBadge status={visit.status as VisitStatus} />
                      
                      {/* Print Slip */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintSlip(visit)}
                                disabled={incomplete}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Print Slip
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {incomplete && (
                            <TooltipContent>
                              <p>Assign doctor and room before printing</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      
                      {visit.payment_amount ? (
                        <div className="flex items-center gap-1 text-sm text-success font-medium">
                          <CheckCircle className="w-4 h-4" />
                          ${Number(visit.payment_amount).toFixed(2)} ({visit.payment_method})
                        </div>
                      ) : (
                        <Dialog open={dialogOpen && selectedVisit === visit.id} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedVisit(visit.id)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Record Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label>Amount ($)</Label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(e.target.value)}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="mobile">Mobile Payment</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                onClick={handleRecordPayment} 
                                className="w-full gradient-primary"
                                disabled={recordPaymentMutation.isPending}
                              >
                                {recordPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Record Payment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {visit.status === 'waiting' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSendToMeasurement(visit.id)}
                          className="gradient-primary"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send to Eye Test
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})
        )}
      </div>
    </AppShell>
  );
}
