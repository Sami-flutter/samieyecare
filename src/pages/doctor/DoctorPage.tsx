import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVisitsByStatus, useEyeMeasurement, useMedicines, useCreatePrescription, useUpdateVisitStatus, Visit, PrescriptionMedicine } from '@/hooks/useClinicData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Stethoscope, Eye, Send, User, Plus, Trash2, Loader2 } from 'lucide-react';

export default function DoctorPage() {
  const { user } = useAuth();
  const { data: waitingPatients = [], isLoading } = useVisitsByStatus('with_doctor');
  const { data: medicines = [] } = useMedicines();
  const createPrescription = useCreatePrescription();
  const updateStatus = useUpdateVisitStatus();
  
  const [selectedVisit, setSelectedVisit] = useState<(Visit & { patient: any }) | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [prescriptionMeds, setPrescriptionMeds] = useState<Omit<PrescriptionMedicine, 'id' | 'prescription_id'>[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [medQuantity, setMedQuantity] = useState('1');
  const [medDosage, setMedDosage] = useState('');

  // Fetch eye measurement for selected visit
  const { data: eyeMeasurement } = useEyeMeasurement(selectedVisit?.id || '');

  const handleSelectPatient = (visit: Visit & { patient: any }) => {
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

    if (prescriptionMeds.some(m => m.medicine_id === selectedMedicine)) {
      toast.error('Medicine already added');
      return;
    }

    setPrescriptionMeds([...prescriptionMeds, {
      medicine_id: selectedMedicine,
      medicine_name: medicine.name,
      quantity: parseInt(medQuantity),
      dosage: medDosage,
    }]);

    setSelectedMedicine('');
    setMedQuantity('1');
    setMedDosage('');
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setPrescriptionMeds(prescriptionMeds.filter(m => m.medicine_id !== medicineId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !user || !diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }

    try {
      await createPrescription.mutateAsync({
        visitId: selectedVisit.id,
        diagnosis,
        followUpNote: followUpNote || undefined,
        medicines: prescriptionMeds,
      });

      await updateStatus.mutateAsync({ visitId: selectedVisit.id, status: 'pharmacy' });
      toast.success('Prescription created! Patient sent to pharmacy.');
      setSelectedVisit(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createPrescription.isPending || updateStatus.isPending;

  return (
    <AppShell>
      <PageHeader title="Doctor Dashboard" description="Review patients and create prescriptions" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="lg:col-span-1 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Waiting Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : waitingPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No patients waiting</p>
            ) : (
              <div className="space-y-2">
                {waitingPatients.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => handleSelectPatient(visit)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedVisit?.id === visit.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedVisit?.id === visit.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'gradient-primary text-primary-foreground'
                      }`}>
                        {visit.queue_number}
                      </div>
                      <div>
                        <p className="font-medium">{visit.patient?.name}</p>
                        <p className={`text-xs ${selectedVisit?.id === visit.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {visit.patient?.age}y · {visit.patient?.gender}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Details and Prescription */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedVisit ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a patient from the list to view details
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Eye Measurement Data */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-primary" />
                    Eye Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!eyeMeasurement ? (
                    <p className="text-muted-foreground">No eye measurements recorded</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">VA Right</p>
                        <p className="font-semibold">{eyeMeasurement.visual_acuity_right || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">VA Left</p>
                        <p className="font-semibold">{eyeMeasurement.visual_acuity_left || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Right (SPH/CYL/AXIS)</p>
                        <p className="font-semibold">
                          {eyeMeasurement.right_sph || 0}/{eyeMeasurement.right_cyl || 0}/{eyeMeasurement.right_axis || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Left (SPH/CYL/AXIS)</p>
                        <p className="font-semibold">
                          {eyeMeasurement.left_sph || 0}/{eyeMeasurement.left_cyl || 0}/{eyeMeasurement.left_axis || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">PD</p>
                        <p className="font-semibold">{eyeMeasurement.pd || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">IOP (R/L)</p>
                        <p className="font-semibold">{eyeMeasurement.iop_right || 'N/A'}/{eyeMeasurement.iop_left || 'N/A'}</p>
                      </div>
                      {eyeMeasurement.notes && (
                        <div className="col-span-2 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="font-medium">{eyeMeasurement.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescription Form */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Create Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Diagnosis *</Label>
                      <Textarea placeholder="Enter diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={3} />
                    </div>

                    {/* Add Medicine */}
                    <div className="space-y-3">
                      <Label>Medicines</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map((med) => (
                              <SelectItem key={med.id} value={med.id}>
                                {med.name} (Stock: {med.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder="Qty" value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} className="w-20" />
                        <Input placeholder="Dosage (e.g., 2x daily)" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="flex-1 min-w-40" />
                        <Button type="button" variant="outline" onClick={handleAddMedicine}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {prescriptionMeds.length > 0 && (
                        <div className="border rounded-lg divide-y">
                          {prescriptionMeds.map((med) => (
                            <div key={med.medicine_id} className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium">{med.medicine_name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {med.quantity} · {med.dosage}</p>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMedicine(med.medicine_id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Follow-up Note</Label>
                      <Textarea placeholder="Instructions for follow-up..." value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} rows={2} />
                    </div>

                    <Button type="submit" className="w-full gradient-primary" disabled={isPending}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Create Prescription & Send to Pharmacy
                    </Button>
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
