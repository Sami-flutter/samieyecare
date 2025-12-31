import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatients, useTodayVisits, useLowStockMedicines, useDailyStats } from '@/hooks/useClinicData';
import { Users, DollarSign, Pill, AlertTriangle, Activity, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data: patients = [] } = usePatients();
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const { data: lowStockMeds = [] } = useLowStockMedicines();
  const { data: stats } = useDailyStats();

  return (
    <AppShell>
      <PageHeader title="Admin Dashboard" description="Overview of clinic operations" />

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
          value={stats?.totalPatients || 0}
          icon={Activity}
          variant="info"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Today's Income"
          value={`$${(stats?.totalIncome || 0).toFixed(0)}`}
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
                      <p className="text-xs text-muted-foreground">Min: {med.low_stock_threshold}</p>
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : todayVisits.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No visits today</p>
            ) : (
              <div className="space-y-3">
                {todayVisits.slice(0, 5).map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {visit.queue_number}
                      </div>
                      <div>
                        <p className="font-medium">{visit.patient?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{visit.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {visit.payment_amount && (
                      <p className="font-semibold text-success">${visit.payment_amount}</p>
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
