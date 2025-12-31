import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { Users, DollarSign, Pill, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { patients, getTodayVisits, medicines, getLowStockMedicines } = useClinicData();
  
  const todayVisits = getTodayVisits();
  const completedToday = todayVisits.filter(v => v.status === 'completed').length;
  const totalIncome = todayVisits.reduce((sum, v) => sum + (v.paymentAmount || 0), 0);
  const lowStockMeds = getLowStockMedicines();

  return (
    <AppShell>
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of clinic operations"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Patients"
          value={patients.length}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Today's Visits"
          value={todayVisits.length}
          icon={Activity}
          variant="info"
        />
        <StatCard
          title="Completed"
          value={completedToday}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Today's Income"
          value={`$${totalIncome.toFixed(0)}`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Low Stock Medicines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockMeds.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">All medicines are well stocked</p>
            ) : (
              <div className="space-y-3">
                {lowStockMeds.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-3">
                      <Pill className="w-4 h-4 text-warning" />
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">{med.stock} left</p>
                      <p className="text-xs text-muted-foreground">Min: {med.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Visits */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayVisits.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No visits today</p>
            ) : (
              <div className="space-y-3">
                {todayVisits.slice(0, 5).map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {visit.queueNumber}
                      </div>
                      <div>
                        <p className="font-medium">{visit.patient?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{visit.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {visit.paymentAmount && (
                      <p className="font-semibold text-success">${visit.paymentAmount}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
