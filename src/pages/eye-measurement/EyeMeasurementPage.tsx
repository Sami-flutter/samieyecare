import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, Send, User } from 'lucide-react';
import { Visit } from '@/types/clinic';

export default function EyeMeasurementPage() {
  const { user } = useAuth();
  const { getVisitsByStatus, addEyeMeasurement, updateVisitStatus, getEyeMeasurementByVisit } = useClinicData();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [formData, setFormData] = useState({
    visualAcuityRight: '',
    visualAcuityLeft: '',
    rightSph: '',
    rightCyl: '',
    rightAxis: '',
    leftSph: '',
    leftCyl: '',
    leftAxis: '',
    pd: '',
    iopRight: '',
    iopLeft: '',
    notes: '',
  });

  const waitingPatients = getVisitsByStatus('eye_measurement');

  const handleSelectPatient = (visit: Visit) => {
    setSelectedVisit(visit);
    // Check if measurement already exists
    const existing = getEyeMeasurementByVisit(visit.id);
    if (existing) {
      setFormData({
        visualAcuityRight: existing.visualAcuityRight || '',
        visualAcuityLeft: existing.visualAcuityLeft || '',
        rightSph: existing.rightEye.sph?.toString() || '',
        rightCyl: existing.rightEye.cyl?.toString() || '',
        rightAxis: existing.rightEye.axis?.toString() || '',
        leftSph: existing.leftEye.sph?.toString() || '',
        leftCyl: existing.leftEye.cyl?.toString() || '',
        leftAxis: existing.leftEye.axis?.toString() || '',
        pd: existing.pd?.toString() || '',
        iopRight: existing.iopRight?.toString() || '',
        iopLeft: existing.iopLeft?.toString() || '',
        notes: existing.notes || '',
      });
    } else {
      setFormData({
        visualAcuityRight: '',
        visualAcuityLeft: '',
        rightSph: '',
        rightCyl: '',
        rightAxis: '',
        leftSph: '',
        leftCyl: '',
        leftAxis: '',
        pd: '',
        iopRight: '',
        iopLeft: '',
        notes: '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !user) return;

    addEyeMeasurement({
      visitId: selectedVisit.id,
      visualAcuityRight: formData.visualAcuityRight || undefined,
      visualAcuityLeft: formData.visualAcuityLeft || undefined,
      rightEye: {
        sph: formData.rightSph ? parseFloat(formData.rightSph) : undefined,
        cyl: formData.rightCyl ? parseFloat(formData.rightCyl) : undefined,
        axis: formData.rightAxis ? parseFloat(formData.rightAxis) : undefined,
      },
      leftEye: {
        sph: formData.leftSph ? parseFloat(formData.leftSph) : undefined,
        cyl: formData.leftCyl ? parseFloat(formData.leftCyl) : undefined,
        axis: formData.leftAxis ? parseFloat(formData.leftAxis) : undefined,
      },
      pd: formData.pd ? parseFloat(formData.pd) : undefined,
      iopRight: formData.iopRight ? parseFloat(formData.iopRight) : undefined,
      iopLeft: formData.iopLeft ? parseFloat(formData.iopLeft) : undefined,
      notes: formData.notes || undefined,
      createdBy: user.id,
    });

    updateVisitStatus(selectedVisit.id, 'with_doctor');
    toast.success('Eye measurements saved! Patient sent to doctor.');
    setSelectedVisit(null);
  };

  return (
    <AppShell>
      <PageHeader 
        title="Eye Measurement" 
        description="Record patient eye test data"
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

        {/* Measurement Form */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-primary" />
              Eye Test Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedVisit ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a patient from the list to record measurements
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Visual Acuity */}
                <div>
                  <h4 className="font-medium mb-3">Visual Acuity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Right Eye (OD)</Label>
                      <Input
                        placeholder="e.g., 20/20"
                        value={formData.visualAcuityRight}
                        onChange={(e) => setFormData({ ...formData, visualAcuityRight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Left Eye (OS)</Label>
                      <Input
                        placeholder="e.g., 20/20"
                        value={formData.visualAcuityLeft}
                        onChange={(e) => setFormData({ ...formData, visualAcuityLeft: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Eye Refraction */}
                <div>
                  <h4 className="font-medium mb-3">Right Eye Refraction (OD)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SPH</Label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="-2.00"
                        value={formData.rightSph}
                        onChange={(e) => setFormData({ ...formData, rightSph: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CYL</Label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="-0.50"
                        value={formData.rightCyl}
                        onChange={(e) => setFormData({ ...formData, rightCyl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AXIS</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={formData.rightAxis}
                        onChange={(e) => setFormData({ ...formData, rightAxis: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye Refraction */}
                <div>
                  <h4 className="font-medium mb-3">Left Eye Refraction (OS)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SPH</Label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="-2.00"
                        value={formData.leftSph}
                        onChange={(e) => setFormData({ ...formData, leftSph: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CYL</Label>
                      <Input
                        type="number"
                        step="0.25"
                        placeholder="-0.50"
                        value={formData.leftCyl}
                        onChange={(e) => setFormData({ ...formData, leftCyl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AXIS</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={formData.leftAxis}
                        onChange={(e) => setFormData({ ...formData, leftAxis: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* PD and IOP */}
                <div>
                  <h4 className="font-medium mb-3">Additional Measurements</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>PD (mm)</Label>
                      <Input
                        type="number"
                        placeholder="62"
                        value={formData.pd}
                        onChange={(e) => setFormData({ ...formData, pd: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IOP Right</Label>
                      <Input
                        type="number"
                        placeholder="15"
                        value={formData.iopRight}
                        onChange={(e) => setFormData({ ...formData, iopRight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IOP Left</Label>
                      <Input
                        type="number"
                        placeholder="15"
                        value={formData.iopLeft}
                        onChange={(e) => setFormData({ ...formData, iopLeft: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional observations..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full gradient-primary">
                  <Send className="w-4 h-4 mr-2" />
                  Save & Send to Doctor
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
