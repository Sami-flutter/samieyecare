import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useVisitsByStatus, useUpdateVisitStatus, VisitWithPatient } from '@/hooks/useVisits';
import { useEyeMeasurementByVisit, useAddEyeMeasurement } from '@/hooks/useEyeMeasurements';
import { toast } from 'sonner';
import { Eye, Send, User, Loader2 } from 'lucide-react';

export default function EyeMeasurementPage() {
  const { user } = useAuth();
  const { data: waitingPatients = [], isLoading } = useVisitsByStatus('eye_measurement');
  const updateStatusMutation = useUpdateVisitStatus();
  const addMeasurementMutation = useAddEyeMeasurement();
  
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPatient | null>(null);
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

  const { data: existingMeasurement } = useEyeMeasurementByVisit(selectedVisit?.id || null);

  const handleSelectPatient = (visit: VisitWithPatient) => {
    setSelectedVisit(visit);
    // Reset form
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
  };

  // Pre-fill form if measurement exists
  useState(() => {
    if (existingMeasurement) {
      setFormData({
        visualAcuityRight: existingMeasurement.visual_acuity_right || '',
        visualAcuityLeft: existingMeasurement.visual_acuity_left || '',
        rightSph: existingMeasurement.right_sph?.toString() || '',
        rightCyl: existingMeasurement.right_cyl?.toString() || '',
        rightAxis: existingMeasurement.right_axis?.toString() || '',
        leftSph: existingMeasurement.left_sph?.toString() || '',
        leftCyl: existingMeasurement.left_cyl?.toString() || '',
        leftAxis: existingMeasurement.left_axis?.toString() || '',
        pd: existingMeasurement.pd?.toString() || '',
        iopRight: existingMeasurement.iop_right?.toString() || '',
        iopLeft: existingMeasurement.iop_left?.toString() || '',
        notes: existingMeasurement.notes || '',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !user) return;

    try {
      await addMeasurementMutation.mutateAsync({
        visit_id: selectedVisit.id,
        visual_acuity_right: formData.visualAcuityRight || null,
        visual_acuity_left: formData.visualAcuityLeft || null,
        right_sph: formData.rightSph ? parseFloat(formData.rightSph) : null,
        right_cyl: formData.rightCyl ? parseFloat(formData.rightCyl) : null,
        right_axis: formData.rightAxis ? parseInt(formData.rightAxis) : null,
        left_sph: formData.leftSph ? parseFloat(formData.leftSph) : null,
        left_cyl: formData.leftCyl ? parseFloat(formData.leftCyl) : null,
        left_axis: formData.leftAxis ? parseInt(formData.leftAxis) : null,
        pd: formData.pd ? parseFloat(formData.pd) : null,
        iop_right: formData.iopRight ? parseFloat(formData.iopRight) : null,
        iop_left: formData.iopLeft ? parseFloat(formData.iopLeft) : null,
        notes: formData.notes || null,
        created_by: user.id,
      });

      await updateStatusMutation.mutateAsync({ visitId: selectedVisit.id, status: 'with_doctor' });
      toast.success('Eye measurements saved! Patient sent to doctor.');
      setSelectedVisit(null);
    } catch (error) {
      toast.error('Failed to save measurements');
    }
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
                        <p className="font-medium">{visit.patients?.name}</p>
                        <p className={`text-xs ${selectedVisit?.id === visit.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {visit.patients?.age}y · {visit.patients?.gender}
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

                <Button 
                  type="submit" 
                  className="w-full gradient-primary"
                  disabled={addMeasurementMutation.isPending || updateStatusMutation.isPending}
                >
                  {(addMeasurementMutation.isPending || updateStatusMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
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
