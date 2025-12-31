import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTodayVisits, useUpdateVisitStatus, useRecordPayment } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import { DollarSign, Send, CheckCircle, Loader2 } from 'lucide-react';

type PaymentMethod = 'cash' | 'card' | 'mobile';

export default function QueueManagement() {
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const updateStatus = useUpdateVisitStatus();
  const recordPayment = useRecordPayment();
  
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRecordPayment = () => {
    if (!selectedVisit || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }
    
    recordPayment.mutate(
      { visitId: selectedVisit, method: paymentMethod, amount: parseFloat(paymentAmount) },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setPaymentAmount('');
          setSelectedVisit(null);
        }
      }
    );
  };

  const handleSendToMeasurement = (visitId: string) => {
    updateStatus.mutate(
      { visitId, status: 'eye_measurement' },
      { onSuccess: () => toast.success('Patient sent to Eye Measurement') }
    );
  };

  return (
    <AppShell>
      <PageHeader title="Queue Management" description="View and manage today's patient queue" />

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : todayVisits.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              No visits today. Register a patient to create a visit.
            </CardContent>
          </Card>
        ) : (
          todayVisits.map((visit) => (
            <Card key={visit.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {visit.queue_number}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{visit.patient?.name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {visit.patient?.phone} · {visit.patient?.age}y · {visit.patient?.gender}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto">
                    <StatusBadge status={visit.status} />
                    
                    {visit.payment_amount ? (
                      <div className="flex items-center gap-1 text-sm text-success font-medium">
                        <CheckCircle className="w-4 h-4" />
                        ${visit.payment_amount} ({visit.payment_method})
                      </div>
                    ) : (
                      <Dialog open={dialogOpen && selectedVisit === visit.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedVisit(visit.id)}>
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
                            <Button onClick={handleRecordPayment} className="w-full gradient-primary" disabled={recordPayment.isPending}>
                              {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Record Payment
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {visit.status === 'waiting' && (
                      <Button size="sm" onClick={() => handleSendToMeasurement(visit.id)} className="gradient-primary" disabled={updateStatus.isPending}>
                        <Send className="w-4 h-4 mr-1" />
                        Send to Eye Test
                      </Button>
                    )}
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
