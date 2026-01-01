import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatients } from '@/hooks/usePatients';
import { useTodayVisits, useVisits } from '@/hooks/useVisits';
import { useTodayPharmacySales, useAllPharmacySales } from '@/hooks/usePharmacySales';
import { Users, DollarSign, TrendingUp, Calendar, Pill, ShoppingCart, Receipt } from 'lucide-react';

export default function ReportsPage() {
  const { data: patients = [] } = usePatients();
  const { data: todayVisits = [], isLoading } = useTodayVisits();
  const { data: allVisits = [] } = useVisits();
  const { data: todayPharmacySales = [] } = useTodayPharmacySales();
  const { data: allPharmacySales = [] } = useAllPharmacySales();
  
  // Consultation revenue (from visits payment)
  const consultationRevenue = todayVisits.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0);
  const completedToday = todayVisits.filter(v => v.status === 'completed').length;
  
  // Pharmacy revenue
  const pharmacyRevenueToday = todayPharmacySales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const pharmacySalesCount = todayPharmacySales.length;
  
  // Total medicines sold today
  const medicinesSoldToday = todayPharmacySales.reduce((sum, sale) => {
    return sum + (sale.pharmacy_sale_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
  }, 0);

  // Total revenue
  const totalRevenueToday = consultationRevenue + pharmacyRevenueToday;

  // Payment breakdown for consultations
  const consultationPaymentBreakdown = todayVisits.reduce((acc, v) => {
    if (v.payment_method && v.payment_amount) {
      acc[v.payment_method] = (acc[v.payment_method] || 0) + Number(v.payment_amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // Payment breakdown for pharmacy
  const pharmacyPaymentBreakdown = todayPharmacySales.reduce((acc, s) => {
    if (s.payment_method && s.total_amount) {
      acc[s.payment_method] = (acc[s.payment_method] || 0) + Number(s.total_amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // All-time pharmacy totals
  const allTimePharmacyRevenue = allPharmacySales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <AppShell>
      <PageHeader title="Reports" description="View clinic statistics and reports" />
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : todayVisits.length}</p>
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
                <p className="text-2xl font-bold">{isLoading ? '...' : completedToday}</p>
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
                <p className="text-sm text-muted-foreground">Total Revenue Today</p>
                <p className="text-2xl font-bold">${totalRevenueToday.toFixed(0)}</p>
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

      {/* Revenue Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Consultation Revenue */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Consultation Revenue (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-4">${consultationRevenue.toFixed(2)}</div>
            {Object.keys(consultationPaymentBreakdown).length === 0 ? (
              <p className="text-center text-muted-foreground py-2">No consultation payments today</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(consultationPaymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{method}</p>
                    <p className="text-lg font-semibold">${amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pharmacy Revenue */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Pharmacy Revenue (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-4">${pharmacyRevenueToday.toFixed(2)}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Sales Count</p>
                <p className="text-lg font-semibold">{pharmacySalesCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Medicines Sold</p>
                <p className="text-lg font-semibold">{medicinesSoldToday}</p>
              </div>
            </div>
            {Object.keys(pharmacyPaymentBreakdown).length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(pharmacyPaymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground capitalize">{method}</p>
                    <p className="text-lg font-semibold">${amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Time Statistics */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>All Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-3xl font-bold">{allVisits.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold">{patients.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Pharmacy Sales</p>
              <p className="text-3xl font-bold">{allPharmacySales.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm text-muted-foreground">Pharmacy Revenue</p>
              <p className="text-3xl font-bold">${allTimePharmacyRevenue.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
