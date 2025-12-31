import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPatient() {
  const navigate = useNavigate();
  const { addPatient, createVisit } = useClinicData();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '' as 'male' | 'female' | 'other' | '',
  });
  const [createVisitAfter, setCreateVisitAfter] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.age || !formData.gender) {
      toast.error('Please fill in all fields');
      return;
    }

    const patient = addPatient({
      name: formData.name,
      phone: formData.phone,
      age: parseInt(formData.age),
      gender: formData.gender as 'male' | 'female' | 'other',
    });

    if (createVisitAfter) {
      const visit = createVisit(patient.id);
      toast.success(`Patient registered! Queue #${visit.queueNumber}`);
    } else {
      toast.success('Patient registered successfully!');
    }

    navigate('/reception');
  };

  return (
    <AppShell>
      <PageHeader title="Register New Patient" description="Add a new patient to the system">
        <Button variant="outline" onClick={() => navigate('/reception')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <Card className="max-w-xl shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter patient's full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Age"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="createVisit"
                checked={createVisitAfter}
                onChange={(e) => setCreateVisitAfter(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="createVisit" className="text-sm font-normal cursor-pointer">
                Create a visit (queue number) after registration
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/reception')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gradient-primary">
                Register Patient
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
