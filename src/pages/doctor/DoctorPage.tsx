import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitsByDoctor, useUpdateVisitStatus, VisitWithPatient, VisitStatus } from '@/hooks/useVisits';
import { useEyeMeasurementByVisit } from '@/hooks/useEyeMeasurements';
import { useMedicines } from '@/hooks/useMedicines';
import { useAddPrescription } from '@/hooks/usePrescriptions';
import { usePrint } from '@/hooks/usePrint';
import { PrescriptionPrint } from '@/components/print/PrescriptionPrint';
import { toast } from 'sonner';
import { Stethoscope, Eye, Send, User, Plus, Trash2, Loader2, Printer, Play, UserCheck } from 'lucide-react';

interface PrescriptionMed {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage: string;
}

export default function DoctorPage() {
  const { user } = useAuth();
  // Get visits assigned to this doctor
  const { data: doctorQueue = [], isLoading } = useVisitsByDoctor(user?.id || null);
  const { data: medicines = [] } = useMedicines();
  const updateStatusMutation = useUpdateVisitStatus();
  const addPrescriptionMutation = useAddPrescription();
  const { printElement } = usePrint();
  
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPatient | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [prescriptionMeds, setPrescriptionMeds] = useState<PrescriptionMed[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [medQuantity, setMedQuantity] = useState('1');
  const [medDosage, setMedDosage] = useState('');
  const [buyFromClinic, setBuyFromClinic] = useState(true);
  
  // Print state
  const [printData, setPrintData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: eyeMeasurement } = useEyeMeasurementByVisit(selectedVisit?.id || null);

  // Filter visits by status
  const waitingPatients = doctorQueue.filter(v => v.status === 'waiting' || v.status === 'with_doctor');
  const inConsultation = doctorQueue.find(v => v.status === 'in_consultation');

  const handleSelectPatient = (visit: VisitWithPatient) => {
    setSelectedVisit(visit);
    setDiagnosis('');
    setFollowUpNote('');
    setPrescriptionMeds([]);
    setBuyFromClinic(true);
  };

  const handleCallNext = async (visit: VisitWithPatient) => {
    try {
      await updateStatusMutation.mutateAsync({ visitId: visit.id, status: 'in_consultation' });
      setSelectedVisit(visit);
      toast.success(`Called ${visit.patients?.name} for consultation`);
    } catch (error) {
      toast.error('Failed to call patient');
    }
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

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault();
    if (!selectedVisit || !user || !diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }

    // Confirmation
    if (!window.confirm('Are you sure you want to create this prescription and send patient to pharmacy?')) {
      return;
    }

    try {
      await addPrescriptionMutation.mutateAsync({
        visitId: selectedVisit.id,
        diagnosis,
        followUpNote: followUpNote || undefined,
        createdBy: user.id,
        medicines: prescriptionMeds,
        buyFromClinic,
      });
      
      const nextStatus: VisitStatus = buyFromClinic ? 'pharmacy' : 'completed';
      await updateStatusMutation.mutateAsync({ visitId: selectedVisit.id, status: nextStatus });
      
      if (shouldPrint) {
        // Set print data and print
        setPrintData({
          patientName: selectedVisit.patients?.name || 'Unknown',
          patientAge: selectedVisit.patients?.age || 0,
          patientGender: selectedVisit.patients?.gender || 'other',
          tokenNumber: selectedVisit.queue_number,
          doctorName: (user as any).name || 'Doctor',
          diagnosis,
          medicines: prescriptionMeds.map(m => ({
            medicineName: m.medicineName,
            quantity: m.quantity,
            dosage: m.dosage,
          })),
          followUpNote,
          buyFromClinic,
        });
        setTimeout(() => {
          printElement(printRef.current);
        }, 100);
      }
      
      toast.success(buyFromClinic 
        ? 'Prescription created! Patient sent to pharmacy.' 
        : 'Prescription created! Visit completed.');
      setSelectedVisit(null);
      setDiagnosis('');
      setFollowUpNote('');
      setPrescriptionMeds([]);
    } catch (error) {
      toast.error('Failed to create prescription');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Doctor Dashboard" description="Review patients and create prescriptions" />
      
      {/* Hidden print element */}
      <div className="hidden">
        {printData && (
          <PrescriptionPrint
            ref={printRef}
            date={new Date()}
            patientName={printData.patientName}
            patientAge={printData.patientAge}
            patientGender={printData.patientGender}
            tokenNumber={printData.tokenNumber}
            doctorName={printData.doctorName}
            diagnosis={printData.diagnosis}
            medicines={printData.medicines}
            followUpNote={printData.followUpNote}
            buyFromClinic={printData.buyFromClinic}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue Column */}
        <Card className="lg:col-span-1 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />My Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : waitingPatients.length === 0 && !inConsultation ? (
              <p className="text-center text-muted-foreground py-8">No patients assigned to you</p>
            ) : (
              <div className="space-y-3">
                {/* Currently in consultation */}
                {inConsultation && (
                  <div className="mb-4">
                    <p className="text-xs uppercase text-muted-foreground mb-2">In Consultation</p>
                    <button 
                      onClick={() => handleSelectPatient(inConsultation)}
                      className={`w-full p-4 rounded-lg text-left border-2 border-primary bg-primary/10 ${selectedVisit?.id === inConsultation.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">{inConsultation.queue_number}</div>
                        <div>
                          <p className="font-medium">{inConsultation.patients?.name}</p>
                          <p className="text-xs text-muted-foreground">{inConsultation.patients?.age}y · {inConsultation.patients?.gender}</p>
                        </div>
                        <UserCheck className="w-5 h-5 text-primary ml-auto" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Waiting patients */}
                {waitingPatients.length > 0 && (
                  <>
                    <p className="text-xs uppercase text-muted-foreground">Waiting ({waitingPatients.length})</p>
                    {waitingPatients.map((visit, index) => (
                      <div key={visit.id} className="flex items-center gap-2">
                        <button 
                          onClick={() => handleSelectPatient(visit)}
                          className={`flex-1 p-4 rounded-lg text-left transition-all ${selectedVisit?.id === visit.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedVisit?.id === visit.id ? 'bg-primary-foreground/20' : 'gradient-primary text-primary-foreground'}`}>{visit.queue_number}</div>
                            <div>
                              <p className="font-medium">{visit.patients?.name}</p>
                              <p className={`text-xs ${selectedVisit?.id === visit.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{visit.patients?.age}y · {visit.patients?.gender}</p>
                            </div>
                          </div>
                        </button>
                        {index === 0 && !inConsultation && (
                          <Button 
                            size="sm" 
                            onClick={() => handleCallNext(visit)}
                            className="gradient-primary"
                            disabled={updateStatusMutation.isPending}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedVisit ? (
            <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">Select a patient from your queue</CardContent></Card>
          ) : (
            <>
              {/* Eye Measurements Card */}
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

              {/* Prescription Form */}
              <Card className="shadow-soft">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="w-5 h-5 text-primary" />Create Prescription</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
                    <div className="space-y-2"><Label>Diagnosis *</Label><Textarea placeholder="Enter diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={3} /></div>
                    
                    <div className="space-y-3">
                      <Label>Medicines</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select value={selectedMedicine} onValueChange={setSelectedMedicine}><SelectTrigger className="w-48"><SelectValue placeholder="Select medicine" /></SelectTrigger><SelectContent>{medicines.map((med) => (<SelectItem key={med.id} value={med.id}>{med.name} ({med.stock})</SelectItem>))}</SelectContent></Select>
                        <Input type="number" placeholder="Qty" value={medQuantity} onChange={(e) => setMedQuantity(e.target.value)} className="w-20" />
                        <Input placeholder="Dosage (e.g., 1 drop 3x daily)" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="flex-1 min-w-40" />
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
                    
                    {/* Buy from clinic option */}
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <Checkbox 
                        id="buyFromClinic" 
                        checked={buyFromClinic} 
                        onCheckedChange={(checked) => setBuyFromClinic(checked as boolean)}
                      />
                      <div>
                        <Label htmlFor="buyFromClinic" className="cursor-pointer">Patient will buy from clinic pharmacy</Label>
                        <p className="text-xs text-muted-foreground">Uncheck if patient will purchase medicines outside</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 gradient-primary" disabled={addPrescriptionMutation.isPending}>
                        {addPrescriptionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        <Send className="w-4 h-4 mr-2" />
                        {buyFromClinic ? 'Send to Pharmacy' : 'Complete Visit'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={(e) => handleSubmit(e as any, true)} 
                        disabled={addPrescriptionMutation.isPending}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Save & Print
                      </Button>
                    </div>
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
