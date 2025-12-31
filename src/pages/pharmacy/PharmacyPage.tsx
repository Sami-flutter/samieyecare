import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateVisitStatus } from '@/hooks/useVisits';
import { useLowStockMedicines, useMedicines } from '@/hooks/useMedicines';
import { usePendingPrescriptions, useDispensePrescription } from '@/hooks/usePrescriptions';
import { toast } from 'sonner';
import { Pill, CheckCircle, Package, AlertTriangle, Loader2 } from 'lucide-react';

export default function PharmacyPage() {
  const { user } = useAuth();
  const { data: pendingPrescriptions = [], isLoading } = usePendingPrescriptions();
  const { data: medicines = [] } = useMedicines();
  const { data: lowStockMeds = [] } = useLowStockMedicines();
  const updateStatusMutation = useUpdateVisitStatus();
  const dispenseMutation = useDispensePrescription();

  const handleDispense = async (visitId: string, prescriptionId: string, meds: { medicineId: string; quantity: number }[]) => {
    if (!user) return;
    try {
      await dispenseMutation.mutateAsync({ prescriptionId, dispensedBy: user.id, medicines: meds });
      await updateStatusMutation.mutateAsync({ visitId, status: 'completed' });
      toast.success('Prescription dispensed! Visit completed.');
    } catch (error) {
      toast.error('Failed to dispense');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Pharmacy" description="Dispense prescriptions and manage stock" />
      {lowStockMeds.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5 shadow-soft">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div><p className="font-medium text-warning-foreground">Low Stock Alert</p><p className="text-sm text-muted-foreground">{lowStockMeds.map(m => `${m.name} (${m.stock})`).join(', ')}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Pill className="w-5 h-5 text-primary" />Pending Prescriptions</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : pendingPrescriptions.length === 0 ? (
          <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">No prescriptions pending</CardContent></Card>
        ) : (
          pendingPrescriptions.map((prescription: any) => (
            <Card key={prescription.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{prescription.visits?.queue_number}</div>
                    <div><CardTitle className="text-lg">{prescription.visits?.patients?.name}</CardTitle><p className="text-sm text-muted-foreground">{prescription.visits?.patients?.phone}</p></div>
                  </div>
                  <Button onClick={() => handleDispense(prescription.visit_id, prescription.id, prescription.prescription_medicines.map((m: any) => ({ medicineId: m.medicine_id, quantity: m.quantity })))} className="gradient-primary" disabled={dispenseMutation.isPending}>
                    {dispenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}Dispense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground uppercase">Diagnosis</p><p className="font-medium mt-1">{prescription.diagnosis}</p></div>
                  {prescription.prescription_medicines?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-2">Medicines</p>
                      <div className="grid gap-2">
                        {prescription.prescription_medicines.map((med: any) => {
                          const medicine = medicines.find(m => m.id === med.medicine_id);
                          const isLowStock = medicine && medicine.stock <= med.quantity;
                          return (
                            <div key={med.id} className={`flex items-center justify-between p-3 rounded-lg ${isLowStock ? 'bg-warning/10 border border-warning/30' : 'bg-muted/30'}`}>
                              <div className="flex items-center gap-3"><Package className={`w-4 h-4 ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`} /><div><p className="font-medium">{med.medicine_name}</p><p className="text-sm text-muted-foreground">{med.dosage}</p></div></div>
                              <div className="text-right"><p className="font-semibold">× {med.quantity}</p>{medicine && <p className={`text-xs ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`}>Stock: {medicine.stock}</p>}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {prescription.follow_up_note && <div className="p-3 rounded-lg bg-info/10 border border-info/20"><p className="text-xs text-info uppercase">Follow-up</p><p className="text-sm mt-1">{prescription.follow_up_note}</p></div>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
