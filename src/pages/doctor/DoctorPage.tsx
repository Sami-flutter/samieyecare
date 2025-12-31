import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Stethoscope, Eye, Send, User, Plus, Trash2 } from 'lucide-react';
import { Visit, PrescriptionMedicine } from '@/types/clinic';

export default function DoctorPage() {
  const { user } = useAuth();
  const { getVisitsByStatus, getEyeMeasurementByVisit, addPrescription, updateVisitStatus, medicines } = useClinicData();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [prescriptionMeds, setPrescriptionMeds] = useState<PrescriptionMedicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [medQuantity, setMedQuantity] = useState('1');
  const [medDosage, setMedDosage] = useState('');

  const waitingPatients = getVisitsByStatus('with_doctor');

  const handleSelectPatient = (visit: Visit) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !user || !diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }

    addPrescription({
      visitId: selectedVisit.id,
      diagnosis,
      medicines: prescriptionMeds,
      followUpNote: followUpNote || undefined,
      createdBy: user.id,
    });

    updateVisitStatus(selectedVisit.id, 'pharmacy');
    toast.success('Prescription created! Patient sent to pharmacy.');
    setSelectedVisit(null);
  };

  const eyeMeasurement = selectedVisit ? getEyeMeasurementByVisit(selectedVisit.id) : null;

  return (
    <AppShell>
      <PageHeader 
        title="Doctor Dashboard" 
        description="Review patients and create prescriptions"
      />

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
            {waitingPatients.length === 0 ? (
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
                        {visit.queueNumber}
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
                        <p className="font-semibold">{eyeMeasurement.visualAcuityRight || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">VA Left</p>
                        <p className="font-semibold">{eyeMeasurement.visualAcuityLeft || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Right (SPH/CYL/AXIS)</p>
                        <p className="font-semibold">
                          {eyeMeasurement.rightEye.sph || 0}/{eyeMeasurement.rightEye.cyl || 0}/{eyeMeasurement.rightEye.axis || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Left (SPH/CYL/AXIS)</p>
                        <p className="font-semibold">
                          {eyeMeasurement.leftEye.sph || 0}/{eyeMeasurement.leftEye.cyl || 0}/{eyeMeasurement.leftEye.axis || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">PD</p>
                        <p className="font-semibold">{eyeMeasurement.pd || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">IOP (R/L)</p>
                        <p className="font-semibold">{eyeMeasurement.iopRight || 'N/A'}/{eyeMeasurement.iopLeft || 'N/A'}</p>
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
                      <Textarea
                        placeholder="Enter diagnosis..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        rows={3}
                      />
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
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={medQuantity}
                          onChange={(e) => setMedQuantity(e.target.value)}
                          className="w-20"
                        />
                        <Input
                          placeholder="Dosage (e.g., 2x daily)"
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          className="flex-1 min-w-40"
                        />
                        <Button type="button" variant="outline" onClick={handleAddMedicine}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {prescriptionMeds.length > 0 && (
                        <div className="border rounded-lg divide-y">
                          {prescriptionMeds.map((med) => (
                            <div key={med.medicineId} className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium">{med.medicineName}</p>
                                <p className="text-sm text-muted-foreground">Qty: {med.quantity} · {med.dosage}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMedicine(med.medicineId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Follow-up Note</Label>
                      <Textarea
                        placeholder="Instructions for follow-up..."
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Button type="submit" className="w-full gradient-primary">
                      <Send className="w-4 h-4 mr-2" />
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
