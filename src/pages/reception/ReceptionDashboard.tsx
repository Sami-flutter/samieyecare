import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTodayVisits, useSearchPatients, useCreateVisit, usePatients, useDailyStats } from '@/hooks/useClinicData';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, DollarSign, Search, ArrowRight, Loader2 } from 'lucide-react';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: todayVisits = [], isLoading: visitsLoading } = useTodayVisits();
  const { data: patients = [] } = usePatients();
  const { data: searchResults = [], isLoading: searchLoading } = useSearchPatients(searchQuery);
  const { data: stats } = useDailyStats();
  const createVisit = useCreateVisit();

  const handleCreateVisit = (patientId: string) => {
    createVisit.mutate({ patientId });
    setSearchQuery('');
  };

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
          value={patients.length}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Today's Visits"
          value={stats?.totalPatients || 0}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Waiting"
          value={stats?.waiting || 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Today's Income"
          value={`$${(stats?.totalIncome || 0).toFixed(0)}`}
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
          
          {searchQuery.length >= 2 && (
            <div className="mt-3">
              {searchLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="border rounded-lg divide-y">
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
                        disabled={createVisit.isPending}
                      >
                        {createVisit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Visit'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
                  No patients found. <button onClick={() => navigate('/reception/register')} className="text-primary font-medium">Register new patient?</button>
                </div>
              )}
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
          {visitsLoading ? (
            <div className="flex items-center justify-center py-8">
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
                      <p className="font-medium">{visit.patient?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{visit.patient?.phone}</p>
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
