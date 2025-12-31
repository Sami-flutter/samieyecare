import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Pill, CheckCircle, Package, AlertTriangle } from 'lucide-react';

export default function PharmacyPage() {
  const { user } = useAuth();
  const { getVisitsByStatus, getPrescriptionByVisit, dispensePrescription, updateVisitStatus, patients, visits, medicines } = useClinicData();
  
  const pharmacyVisits = getVisitsByStatus('pharmacy');

  const handleDispense = (visitId: string, prescriptionId: string) => {
    if (!user) return;
    
    dispensePrescription(prescriptionId, user.id);
    updateVisitStatus(visitId, 'completed');
    toast.success('Prescription dispensed! Visit completed.');
  };

  const lowStockMeds = medicines.filter(m => m.stock <= m.lowStockThreshold);

  return (
    <AppShell>
      <PageHeader 
        title="Pharmacy" 
        description="Dispense prescriptions and manage stock"
      />

      {/* Low Stock Alert */}
      {lowStockMeds.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5 shadow-soft">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning-foreground">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockMeds.map(m => `${m.name} (${m.stock})`).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Prescriptions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          Pending Prescriptions
        </h2>

        {pharmacyVisits.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center text-muted-foreground">
              No prescriptions pending
            </CardContent>
          </Card>
        ) : (
          pharmacyVisits.map((visit) => {
            const prescription = getPrescriptionByVisit(visit.id);
            if (!prescription) return null;

            return (
              <Card key={visit.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {visit.queueNumber}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{visit.patient?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {visit.patient?.age}y · {visit.patient?.gender}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleDispense(visit.id, prescription.id)}
                      className="gradient-primary"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Dispense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Diagnosis */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Diagnosis</p>
                      <p className="font-medium mt-1">{prescription.diagnosis}</p>
                    </div>

                    {/* Medicines */}
                    {prescription.medicines.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Medicines</p>
                        <div className="grid gap-2">
                          {prescription.medicines.map((med) => {
                            const medicine = medicines.find(m => m.id === med.medicineId);
                            const isLowStock = medicine && medicine.stock <= med.quantity;
                            
                            return (
                              <div 
                                key={med.medicineId} 
                                className={`flex items-center justify-between p-3 rounded-lg ${isLowStock ? 'bg-warning/10 border border-warning/30' : 'bg-muted/30'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className={`w-4 h-4 ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`} />
                                  <div>
                                    <p className="font-medium">{med.medicineName}</p>
                                    <p className="text-sm text-muted-foreground">{med.dosage}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">× {med.quantity}</p>
                                  {medicine && (
                                    <p className={`text-xs ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`}>
                                      Stock: {medicine.stock}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Note */}
                    {prescription.followUpNote && (
                      <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                        <p className="text-xs text-info uppercase tracking-wide">Follow-up Note</p>
                        <p className="text-sm mt-1">{prescription.followUpNote}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
