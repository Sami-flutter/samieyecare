import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { toast } from 'sonner';
import { DollarSign, Send, CheckCircle } from 'lucide-react';
import { PaymentMethod, VisitStatus } from '@/types/clinic';

export default function QueueManagement() {
  const { getTodayVisits, updateVisitStatus, recordPayment } = useClinicData();
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [dialogOpen, setDialogOpen] = useState(false);

  const todayVisits = getTodayVisits();

  const handleRecordPayment = () => {
    if (!selectedVisit || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }
    
    recordPayment(selectedVisit, paymentMethod, parseFloat(paymentAmount));
    toast.success('Payment recorded successfully!');
    setDialogOpen(false);
    setPaymentAmount('');
    setSelectedVisit(null);
  };

  const handleSendToMeasurement = (visitId: string) => {
    updateVisitStatus(visitId, 'eye_measurement');
    toast.success('Patient sent to Eye Measurement');
  };

  return (
    <AppShell>
      <PageHeader 
        title="Queue Management" 
        description="View and manage today's patient queue"
      />

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
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Queue Number */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {visit.queueNumber}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{visit.patient?.name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {visit.patient?.phone} · {visit.patient?.age}y · {visit.patient?.gender}
                      </p>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto">
                    <StatusBadge status={visit.status} />
                    
                    {visit.paymentAmount ? (
                      <div className="flex items-center gap-1 text-sm text-success font-medium">
                        <CheckCircle className="w-4 h-4" />
                        ${visit.paymentAmount} ({visit.paymentMethod})
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
                            <Button onClick={handleRecordPayment} className="w-full gradient-primary">
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
                      >
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
