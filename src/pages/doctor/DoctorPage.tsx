import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitsByStatus, useUpdateVisitStatus, VisitWithPatient } from '@/hooks/useVisits';
import { useEyeMeasurementByVisit } from '@/hooks/useEyeMeasurements';
import { useMedicines } from '@/hooks/useMedicines';
import { useAddPrescription } from '@/hooks/usePrescriptions';
import { toast } from 'sonner';
import { Stethoscope, Eye, Send, User, Plus, Trash2, Loader2 } from 'lucide-react';

interface PrescriptionMed {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage: string;
}

export default function DoctorPage() {
  const { user } = useAuth();
  const { data: waitingPatients = [], isLoading } = useVisitsByStatus('with_doctor');
  const { data: medicines = [] } = useMedicines();
  const updateStatusMutation = useUpdateVisitStatus();
  const addPrescriptionMutation = useAddPrescription();
  
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPatient | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [prescriptionMeds, setPrescriptionMeds] = useState<PrescriptionMed[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [medQuantity, setMedQuantity] = useState('1');
  const [medDosage, setMedDosage] = useState('');

  const { data: eyeMeasurement } = useEyeMeasurementByVisit(selectedVisit?.id || null);

  const handleSelectPatient = (visit: VisitWithPatient) => {
    setSelectedVisit(visit);
    setDiagnosis('');
    setFollowUpNote('');
    setPrescriptionMeds([]);
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine || !medDosage) {
      toast.error('Select medicine and enter dosage');
      return;
    }
    const medicine = medicines.find(m => m.id === selectedMedicine);
    if (!medicine) return;
    if (prescriptionMeds.some(m => m.medicineId === selectedMedicine)) {
      toast.error('Medicine already added');
      return;
    }
    setPrescriptionMeds([...prescriptionMeds, {
      medicineId: selectedMedicine,
      medicineName: medicine.name,
      quantity: parseInt(medQuantity),
      dosage: medDosage,
    }]);
    setSelectedMedicine('');
    setMedQuantity('1');
    setMedDosage('');
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setPrescriptionMeds(prescriptionMeds.filter(m => m.medicineId !== medicineId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !user || !diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }
    try {
      await addPrescriptionMutation.mutateAsync({
        visitId: selectedVisit.id,
        diagnosis,
        followUpNote: followUpNote || undefined,
        createdBy: user.id,
        medicines: prescriptionMeds,
      });
      await updateStatusMutation.mutateAsync({ visitId: selectedVisit.id, status: 'pharmacy' });
      toast.success('Prescription created! Patient sent to pharmacy.');
      setSelectedVisit(null);
    } catch (error) {
      toast.error('Failed to create prescription');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Doctor Dashboard" description="Review patients and create prescriptions" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />Waiting Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : waitingPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No patients waiting</p>
            ) : (
              <div className="space-y-2">
                {waitingPatients.map((visit) => (
                  <button key={visit.id} onClick={() => handleSelectPatient(visit)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${selectedVisit?.id === visit.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedVisit?.id === visit.id ? 'bg-primary-foreground/20' : 'gradient-primary text-primary-foreground'}`}>{visit.queue_number}</div>
                      <div>
                        <p className="font-medium">{visit.patients?.name}</p>
                        <p className={`text-xs ${selectedVisit?.id === visit.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{visit.patients?.age}y · {visit.patients?.gender}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          {!selectedVisit ? (
            <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">Select a patient from the list</CardContent></Card>
          ) : (
            <>
              <Card className="shadow-soft">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Eye className="w-5 h-5 text-primary" />Eye Measurements</CardTitle></CardHeader>
                <CardContent>
                  {!eyeMeasurement ? <p className="text-muted-foreground">No eye measurements recorded</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">VA Right</p><p className="font-semibold">{eyeMeasurement.visual_acuity_right || 'N/A'}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">VA Left</p><p className="font-semibold">{eyeMeasurement.visual_acuity_left || 'N/A'}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Right SPH/CYL/AXIS</p><p className="font-semibold">{eyeMeasurement.right_sph || 0}/{eyeMeasurement.right_cyl || 0}/{eyeMeasurement.right_axis || 0}</p></div>
                      <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Left SPH/CYL/AXIS</p><p className="font-semibold">{eyeMeasurement.left_sph || 0}/{eyeMeasurement.left_cyl || 0}/{eyeMeasurement.left_axis || 0}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="w-5 h-5 text-primary" />Create Prescription</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2"><Label>Diagnosis *</Label><Textarea placeholder="Enter diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={3} /></div>
                    <div className="space-y-3">
                      <Label>Medicines</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select value={selectedMedicine} onValueChange={setSelectedMedicine}><SelectTrigger className="w-48"><SelectValue placeholder="Select medicine" /></SelectTrigger><SelectContent>{medicines.map((med) => (<SelectItem key={med.id} value={med.id}>{med.name} ({med.stock})</SelectItem>))}</SelectContent></Select>
                        <Input type="number" placeholder="Qty" value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} className="w-20" />
                        <Input placeholder="Dosage" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="flex-1 min-w-40" />
                        <Button type="button" variant="outline" onClick={handleAddMedicine}><Plus className="w-4 h-4" /></Button>
                      </div>
                      {prescriptionMeds.length > 0 && (
                        <div className="border rounded-lg divide-y">
                          {prescriptionMeds.map((med) => (
                            <div key={med.medicineId} className="flex items-center justify-between p-3">
                              <div><p className="font-medium">{med.medicineName}</p><p className="text-sm text-muted-foreground">Qty: {med.quantity} · {med.dosage}</p></div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMedicine(med.medicineId)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2"><Label>Follow-up Note</Label><Textarea placeholder="Instructions..." value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} rows={2} /></div>
                    <Button type="submit" className="w-full gradient-primary" disabled={addPrescriptionMutation.isPending}>{addPrescriptionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}<Send className="w-4 h-4 mr-2" />Send to Pharmacy</Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
