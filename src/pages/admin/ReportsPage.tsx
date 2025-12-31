import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { patients, getTodayVisits, visits } = useClinicData();
  
  const todayVisits = getTodayVisits();
  const totalIncome = todayVisits.reduce((sum, v) => sum + (v.paymentAmount || 0), 0);
  const completedToday = todayVisits.filter(v => v.status === 'completed').length;

  const paymentBreakdown = todayVisits.reduce((acc, v) => {
    if (v.paymentMethod && v.paymentAmount) {
      acc[v.paymentMethod] = (acc[v.paymentMethod] || 0) + v.paymentAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppShell>
      <PageHeader 
        title="Reports" 
        description="View clinic statistics and reports"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-2xl font-bold">{todayVisits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/20">
                <DollarSign className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Income</p>
                <p className="text-2xl font-bold">${totalIncome.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-info/10">
                <Users className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card className="shadow-soft mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Payment Breakdown (Today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(paymentBreakdown).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No payments recorded today</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {Object.entries(paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground capitalize">{method}</p>
                  <p className="text-2xl font-bold text-success">${amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Time Stats */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>All Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-3xl font-bold">{visits.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Patients Registered</p>
              <p className="text-3xl font-bold">{patients.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
