import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTodayVisits, useUpdateVisitStatus, useRecordPayment, VisitStatus } from '@/hooks/useVisits';
import { useDoctors } from '@/hooks/useDoctors';
import { usePrint } from '@/hooks/usePrint';
import { ReceptionSlip } from '@/components/print/ReceptionSlip';
import { toast } from 'sonner';
import { DollarSign, Send, CheckCircle, Loader2, Printer, User, MapPin } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export default function QueueManagement() {
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const { data: doctors = [] } = useDoctors();
  const updateStatusMutation = useUpdateVisitStatus();
  const recordPaymentMutation = useRecordPayment();
  const { printElement } = usePrint();
  
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Print slip state
  const [printSlipData, setPrintSlipData] = useState<{
    patientName: string;
    tokenNumber: number;
    doctorName: string;
    roomNumber: string;
  } | null>(null);
  const printSlipRef = useRef<HTMLDivElement>(null);

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

  const handlePrintSlip = (visit: typeof todayVisits[0]) => {
    const doctorName = visit.doctor?.name || 'Not Assigned';
    const roomNumber = (visit as any).room_number || 'N/A';
    
    setPrintSlipData({
      patientName: visit.patients?.name || 'Unknown',
      tokenNumber: visit.queue_number,
      doctorName,
      roomNumber,
    });
    
    // Wait for state to update then print
    setTimeout(() => {
      printElement(printSlipRef.current);
    }, 100);
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

      <div className="grid gap-4">
        {todayVisits.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              No visits today. Register a patient to create a visit.
            </CardContent>
          </Card>
        ) : (
          todayVisits.map((visit) => (
            <Card key={visit.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
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
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{visit.doctor?.name || 'No doctor'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>Room {(visit as any).room_number || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto">
                      <StatusBadge status={visit.status as VisitStatus} />
                      
                      {/* Print Slip */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintSlip(visit)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Print Slip
                      </Button>
                      
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
          ))
        )}
      </div>
    </AppShell>
  );
}
