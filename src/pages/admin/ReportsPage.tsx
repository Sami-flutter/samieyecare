import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatients } from '@/hooks/usePatients';
import { useTodayVisits, useVisits } from '@/hooks/useVisits';
import { Users, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { data: patients = [] } = usePatients();
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const { data: allVisits = [] } = useVisits();
  
  const totalIncome = todayVisits.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0);
  const completedToday = todayVisits.filter(v => v.status === 'completed').length;
  const paymentBreakdown = todayVisits.reduce((acc, v) => {
    if (v.payment_method && v.payment_amount) {
      acc[v.payment_method] = (acc[v.payment_method] || 0) + Number(v.payment_amount);
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppShell>
      <PageHeader title="Reports" description="View clinic statistics and reports" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-soft"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Today's Visits</p><p className="text-2xl font-bold">{isLoading ? '...' : todayVisits.length}</p></div></div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{isLoading ? '...' : completedToday}</p></div></div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-accent/20"><DollarSign className="w-5 h-5 text-accent-foreground" /></div><div><p className="text-sm text-muted-foreground">Today's Income</p><p className="text-2xl font-bold">${totalIncome.toFixed(0)}</p></div></div></CardContent></Card>
        <Card className="shadow-soft"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-info/10"><Users className="w-5 h-5 text-info" /></div><div><p className="text-sm text-muted-foreground">Total Patients</p><p className="text-2xl font-bold">{patients.length}</p></div></div></CardContent></Card>
      </div>
      <Card className="shadow-soft mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" />Payment Breakdown (Today)</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(paymentBreakdown).length === 0 ? <p className="text-center text-muted-foreground py-4">No payments recorded today</p> : (
            <div className="grid sm:grid-cols-3 gap-4">
              {Object.entries(paymentBreakdown).map(([method, amount]) => (<div key={method} className="p-4 rounded-xl bg-muted/30 text-center"><p className="text-sm text-muted-foreground capitalize">{method}</p><p className="text-2xl font-bold text-success">${amount.toFixed(2)}</p></div>))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-soft">
        <CardHeader><CardTitle>All Time Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-muted/30"><p className="text-sm text-muted-foreground">Total Visits</p><p className="text-3xl font-bold">{allVisits.length}</p></div>
            <div className="p-4 rounded-xl bg-muted/30"><p className="text-sm text-muted-foreground">Total Patients</p><p className="text-3xl font-bold">{patients.length}</p></div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
