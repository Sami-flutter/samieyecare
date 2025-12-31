import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, DollarSign, Search, ArrowRight, Loader2 } from 'lucide-react';
import { usePatients, useSearchPatients } from '@/hooks/usePatients';
import { useTodayVisits, useCreateVisit } from '@/hooks/useVisits';
import { toast } from 'sonner';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: todayVisits = [], isLoading: visitsLoading } = useTodayVisits();
  const { data: searchResults = [] } = useSearchPatients(searchQuery);
  const createVisitMutation = useCreateVisit();

  const waitingCount = todayVisits.filter(v => v.status === 'waiting').length;
  const totalIncome = todayVisits.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0);

  const handleCreateVisit = async (patientId: string) => {
    try {
      const visit = await createVisitMutation.mutateAsync(patientId);
      toast.success(`Visit created! Queue #${visit.queue_number}`);
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to create visit');
    }
  };

  const isLoading = patientsLoading || visitsLoading;

  return (
    <AppShell>
      <PageHeader 
        title="Reception Dashboard" 
        description="Manage patient registrations and queue"
      >
        <Button onClick={() => navigate('/reception/register')} className="gradient-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          New Patient
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Patients"
          value={isLoading ? '...' : patients.length}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Today's Visits"
          value={isLoading ? '...' : todayVisits.length}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Waiting"
          value={isLoading ? '...' : waitingCount}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Today's Income"
          value={isLoading ? '...' : `$${totalIncome.toFixed(0)}`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Quick Search */}
      <Card className="mb-8 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Quick Visit Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patient by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="mt-3 border rounded-lg divide-y">
              {searchResults.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone} · {patient.age}y · {patient.gender}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleCreateVisit(patient.id)} 
                    className="gradient-primary"
                    disabled={createVisitMutation.isPending}
                  >
                    {createVisitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Visit'}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="mt-3 p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
              No patients found. <button onClick={() => navigate('/reception/register')} className="text-primary font-medium">Register new patient?</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Queue */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's Queue</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/reception/queue')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : todayVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No visits today yet. Create a visit to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {todayVisits.slice(0, 5).map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {visit.queue_number}
                    </div>
                    <div>
                      <p className="font-medium">{visit.patients?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{visit.patients?.phone}</p>
                    </div>
                  </div>
                  <StatusBadge status={visit.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
