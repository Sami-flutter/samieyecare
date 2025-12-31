import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatients, useDailyStats, useAllTimeStats } from '@/hooks/useClinicData';
import { Users, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { data: patients = [] } = usePatients();
  const { data: dailyStats, isLoading: dailyLoading } = useDailyStats();
  const { data: allTimeStats, isLoading: allTimeLoading } = useAllTimeStats();

  const isLoading = dailyLoading || allTimeLoading;

  const paymentBreakdown = {
    cash: dailyStats?.cashPayments || 0,
    card: dailyStats?.cardPayments || 0,
    mobile: dailyStats?.mobilePayments || 0,
  };

  const hasPayments = Object.values(paymentBreakdown).some(v => v > 0);

  return (
    <AppShell>
      <PageHeader title="Reports" description="View clinic statistics and reports" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
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
                    <p className="text-2xl font-bold">{dailyStats?.totalPatients || 0}</p>
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
                    <p className="text-2xl font-bold">{dailyStats?.completed || 0}</p>
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
                    <p className="text-2xl font-bold">${(dailyStats?.totalIncome || 0).toFixed(0)}</p>
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
              {!hasPayments ? (
                <p className="text-center text-muted-foreground py-4">No payments recorded today</p>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4">
                  {Object.entries(paymentBreakdown).map(([method, amount]) => (
                    amount > 0 && (
                      <div key={method} className="p-4 rounded-xl bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground capitalize">{method}</p>
                        <p className="text-2xl font-bold text-success">${Number(amount).toFixed(2)}</p>
                      </div>
                    )
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
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-3xl font-bold">{allTimeStats?.totalVisits || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-3xl font-bold">{allTimeStats?.totalPatients || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-3xl font-bold">${(allTimeStats?.totalIncome || 0).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
