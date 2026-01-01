import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateVisitStatus, VisitStatus } from '@/hooks/useVisits';
import { useLowStockMedicines, useMedicines } from '@/hooks/useMedicines';
import { usePendingPrescriptions, useDispensePrescription } from '@/hooks/usePrescriptions';
import { useTodayPharmacySales, useCreatePharmacySale, SaleWithItems } from '@/hooks/usePharmacySales';
import { usePrint } from '@/hooks/usePrint';
import { PharmacyReceipt } from '@/components/print/PharmacyReceipt';
import { PrescriptionPrint } from '@/components/print/PrescriptionPrint';
import { toast } from 'sonner';
import { Pill, CheckCircle, Package, AlertTriangle, Loader2, Printer, ShoppingCart, Receipt, ExternalLink, DollarSign } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

export default function PharmacyPage() {
  const { user } = useAuth();
  const { data: pendingPrescriptions = [], isLoading } = usePendingPrescriptions();
  const { data: medicines = [] } = useMedicines();
  const { data: lowStockMeds = [] } = useLowStockMedicines();
  const { data: todaySales = [] } = useTodayPharmacySales();
  const updateStatusMutation = useUpdateVisitStatus();
  const dispenseMutation = useDispensePrescription();
  const createSaleMutation = useCreatePharmacySale();
  const { printElement } = usePrint();

  // Sale dialog state
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Print refs
  const receiptRef = useRef<HTMLDivElement>(null);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [prescriptionPrintData, setPrescriptionPrintData] = useState<any>(null);

  // Check if sale already exists for prescription
  const getSaleForPrescription = (prescriptionId: string) => {
    return todaySales.find(sale => sale.prescription_id === prescriptionId);
  };

  // Open sale dialog and pre-populate items from prescription
  const handleOpenSaleDialog = (prescription: any) => {
    // Check if sale already exists
    const existingSale = getSaleForPrescription(prescription.id);
    if (existingSale) {
      toast.error('Sale already exists for this prescription');
      return;
    }

    setSelectedPrescription(prescription);
    
    // Pre-populate items from prescription medicines
    const items: SaleItem[] = prescription.prescription_medicines?.map((med: any) => {
      const medicine = medicines.find(m => m.id === med.medicine_id);
      return {
        medicineId: med.medicine_id,
        medicineName: med.medicine_name,
        quantity: med.quantity,
        unitPrice: medicine?.price || 0,
      };
    }) || [];
    
    setSaleItems(items);
    setSaleDialogOpen(true);
  };

  // Update sale item
  const updateSaleItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], [field]: value };
    setSaleItems(updated);
  };

  // Calculate total
  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  // Validate sale items
  const validateSaleItems = () => {
    for (const item of saleItems) {
      if (item.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for ${item.medicineName}`);
        return false;
      }
      if (item.unitPrice < 0) {
        toast.error(`Unit price cannot be negative for ${item.medicineName}`);
        return false;
      }
    }
    return true;
  };

  // Create sale and complete (BUY NOW)
  const handleCreateSale = async (shouldPrint: boolean = false) => {
    if (!selectedPrescription || !user) return;
    if (!validateSaleItems()) return;

    // Confirm before processing
    if (!window.confirm('Confirm creating sale and completing this prescription?')) return;

    setIsProcessing(true);
    try {
      // Create pharmacy sale
      const sale = await createSaleMutation.mutateAsync({
        prescriptionId: selectedPrescription.id,
        visitId: selectedPrescription.visit_id,
        patientId: selectedPrescription.visits?.patients?.id || selectedPrescription.visits?.patient_id,
        createdBy: user.id,
        items: saleItems,
        paymentMethod,
      });

      // Mark prescription as dispensed
      await dispenseMutation.mutateAsync({
        prescriptionId: selectedPrescription.id,
        dispensedBy: user.id,
        medicines: [], // Stock already reduced by createPharmacySale
      });

      // Update visit status to completed
      await updateStatusMutation.mutateAsync({ 
        visitId: selectedPrescription.visit_id, 
        status: 'completed' as VisitStatus 
      });

      if (shouldPrint) {
        // Prepare receipt data and print
        setReceiptData({
          receiptNumber: sale.id.slice(0, 8).toUpperCase(),
          patientName: selectedPrescription.visits?.patients?.name || 'Unknown',
          tokenNumber: selectedPrescription.visits?.queue_number || 0,
          items: saleItems.map(item => ({
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
          totalAmount: calculateTotal(),
          paymentMethod,
        });
        setTimeout(() => {
          printElement(receiptRef.current);
        }, 100);
      }

      toast.success('Sale created! Visit completed.');
      setSaleDialogOpen(false);
      setSelectedPrescription(null);
      setSaleItems([]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create sale');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle buy later / outside (no sale created)
  const handleBuyLater = async (prescription: any) => {
    if (!user) return;
    
    // Confirm
    if (!window.confirm('Mark this prescription as complete? No sale will be created.')) return;

    try {
      // Mark prescription as dispensed (but no stock reduction)
      await dispenseMutation.mutateAsync({
        prescriptionId: prescription.id,
        dispensedBy: user.id,
        medicines: [],
      });

      // Update visit status to completed
      await updateStatusMutation.mutateAsync({ 
        visitId: prescription.visit_id, 
        status: 'completed' as VisitStatus 
      });

      toast.success('Prescription marked complete. Patient will buy outside.');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  // Print prescription only
  const handlePrintPrescription = (prescription: any) => {
    setPrescriptionPrintData({
      patientName: prescription.visits?.patients?.name || 'Unknown',
      patientAge: prescription.visits?.patients?.age || 0,
      patientGender: prescription.visits?.patients?.gender || 'other',
      tokenNumber: prescription.visits?.queue_number || 0,
      doctorName: 'Doctor',
      diagnosis: prescription.diagnosis,
      medicines: prescription.prescription_medicines?.map((m: any) => ({
        medicineName: m.medicine_name,
        quantity: m.quantity,
        dosage: m.dosage,
      })) || [],
      followUpNote: prescription.follow_up_note,
      buyFromClinic: prescription.buy_from_clinic,
    });
    setTimeout(() => {
      printElement(prescriptionRef.current);
    }, 100);
  };

  // Calculate today's sales totals
  const todayTotal = todaySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

  return (
    <AppShell>
      <PageHeader title="Pharmacy" description="Dispense prescriptions and manage sales" />

      {/* Hidden print elements */}
      <div className="hidden">
        {receiptData && (
          <PharmacyReceipt
            ref={receiptRef}
            date={new Date()}
            receiptNumber={receiptData.receiptNumber}
            patientName={receiptData.patientName}
            tokenNumber={receiptData.tokenNumber}
            items={receiptData.items}
            totalAmount={receiptData.totalAmount}
            paymentMethod={receiptData.paymentMethod}
          />
        )}
        {prescriptionPrintData && (
          <PrescriptionPrint
            ref={prescriptionRef}
            date={new Date()}
            patientName={prescriptionPrintData.patientName}
            patientAge={prescriptionPrintData.patientAge}
            patientGender={prescriptionPrintData.patientGender}
            tokenNumber={prescriptionPrintData.tokenNumber}
            doctorName={prescriptionPrintData.doctorName}
            diagnosis={prescriptionPrintData.diagnosis}
            medicines={prescriptionPrintData.medicines}
            followUpNote={prescriptionPrintData.followUpNote}
            buyFromClinic={prescriptionPrintData.buyFromClinic}
          />
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockMeds.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5 shadow-soft">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning-foreground">Low Stock Alert</p>
                <p className="text-sm text-muted-foreground">{lowStockMeds.map(m => `${m.name} (${m.stock})`).join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">{todaySales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">${todayTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Pill className="w-4 h-4" /> Pending ({pendingPrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Today's Sales ({todaySales.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Prescriptions Tab */}
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : pendingPrescriptions.length === 0 ? (
            <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">No prescriptions pending</CardContent></Card>
          ) : (
            pendingPrescriptions.map((prescription: any) => {
              const buyFromClinic = prescription.buy_from_clinic !== false;
              const existingSale = getSaleForPrescription(prescription.id);
              
              return (
                <Card key={prescription.id} className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                          {prescription.visits?.queue_number}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{prescription.visits?.patients?.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{prescription.visits?.patients?.phone}</p>
                        </div>
                        {/* Buy from clinic indicator */}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${buyFromClinic ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {buyFromClinic ? 'Buy from Clinic' : 'Buy Outside'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Print prescription */}
                        <Button variant="outline" size="sm" onClick={() => handlePrintPrescription(prescription)}>
                          <Printer className="w-4 h-4 mr-1" /> Prescription
                        </Button>

                        {existingSale ? (
                          <span className="text-sm text-success font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Sale Created
                          </span>
                        ) : buyFromClinic ? (
                          <Button onClick={() => handleOpenSaleDialog(prescription)} className="gradient-primary">
                            <ShoppingCart className="w-4 h-4 mr-2" /> Create Sale
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => handleBuyLater(prescription)}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase">Diagnosis</p>
                        <p className="font-medium mt-1">{prescription.diagnosis}</p>
                      </div>
                      
                      {prescription.prescription_medicines?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-2">Medicines</p>
                          <div className="grid gap-2">
                            {prescription.prescription_medicines.map((med: any) => {
                              const medicine = medicines.find(m => m.id === med.medicine_id);
                              const isLowStock = medicine && medicine.stock <= med.quantity;
                              return (
                                <div key={med.id} className={`flex items-center justify-between p-3 rounded-lg ${isLowStock ? 'bg-warning/10 border border-warning/30' : 'bg-muted/30'}`}>
                                  <div className="flex items-center gap-3">
                                    <Package className={`w-4 h-4 ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`} />
                                    <div>
                                      <p className="font-medium">{med.medicine_name}</p>
                                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">× {med.quantity}</p>
                                    {medicine && (
                                      <p className={`text-xs ${isLowStock ? 'text-warning' : 'text-muted-foreground'}`}>
                                        Stock: {medicine.stock} · ${medicine.price}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {prescription.follow_up_note && (
                        <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                          <p className="text-xs text-info uppercase">Follow-up</p>
                          <p className="text-sm mt-1">{prescription.follow_up_note}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Today's Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          {todaySales.length === 0 ? (
            <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">No sales today</CardContent></Card>
          ) : (
            todaySales.map((sale: SaleWithItems) => (
              <Card key={sale.id} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.patients?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          Token #{sale.visits?.queue_number} · {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">${Number(sale.total_amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground uppercase">{sale.payment_method}</p>
                    </div>
                  </div>
                  {sale.pharmacy_sale_items?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-2">
                        {sale.pharmacy_sale_items.map((item) => (
                          <span key={item.id} className="text-xs bg-muted px-2 py-1 rounded">
                            {item.medicine_name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Pharmacy Sale</DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedPrescription.visits?.patients?.name}</p>
                <p className="text-sm text-muted-foreground">Token #{selectedPrescription.visits?.queue_number}</p>
              </div>

              {/* Sale Items */}
              <div className="space-y-3">
                <Label>Sale Items</Label>
                {saleItems.map((item, index) => (
                  <div key={item.medicineId} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <p className="text-sm font-medium truncate">{item.medicineName}</p>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-9"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateSaleItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-9"
                        placeholder="Price"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateSale(false)} disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Complete Sale
            </Button>
            <Button onClick={() => handleCreateSale(true)} className="gradient-primary" disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Printer className="w-4 h-4 mr-2" />
              Complete & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
