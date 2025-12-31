import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMedicines, useAddMedicine, useUpdateMedicineStock } from '@/hooks/useMedicines';
import { toast } from 'sonner';
import { Pill, Plus, Package, AlertTriangle, Loader2 } from 'lucide-react';

export default function MedicineManagement() {
  const { data: medicines = [], isLoading } = useMedicines();
  const addMedicineMutation = useAddMedicine();
  const updateStockMutation = useUpdateMedicineStock();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [stockChange, setStockChange] = useState('');
  const [newMedicine, setNewMedicine] = useState({ name: '', category: '', price: '', stock: '', lowStockThreshold: '10' });

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicine.name || !newMedicine.category || !newMedicine.price || !newMedicine.stock) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await addMedicineMutation.mutateAsync({
        name: newMedicine.name,
        category: newMedicine.category,
        price: parseFloat(newMedicine.price),
        stock: parseInt(newMedicine.stock),
        low_stock_threshold: parseInt(newMedicine.lowStockThreshold),
      });
      toast.success('Medicine added!');
      setDialogOpen(false);
      setNewMedicine({ name: '', category: '', price: '', stock: '', lowStockThreshold: '10' });
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedMedicine || !stockChange) return;
    try {
      await updateStockMutation.mutateAsync({ medicineId: selectedMedicine, stockChange: parseInt(stockChange) });
      toast.success('Stock updated!');
      setStockDialogOpen(false);
      setSelectedMedicine(null);
      setStockChange('');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <AppShell>
      <PageHeader title="Medicine Management" description="Manage medicine inventory">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gradient-primary"><Plus className="w-4 h-4 mr-2" />Add Medicine</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Medicine</DialogTitle></DialogHeader>
            <form onSubmit={handleAddMedicine} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Medicine name" value={newMedicine.name} onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category</Label><Input placeholder="e.g., Eye Drops" value={newMedicine.category} onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" value={newMedicine.price} onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Initial Stock</Label><Input type="number" value={newMedicine.stock} onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={addMedicineMutation.isPending}>{addMedicineMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Medicine</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Stock</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Quantity to Add (negative to subtract)</Label><Input type="number" placeholder="e.g., 50 or -10" value={stockChange} onChange={(e) => setStockChange(e.target.value)} /></div>
            <Button onClick={handleUpdateStock} className="w-full gradient-primary" disabled={updateStockMutation.isPending}>{updateStockMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Update Stock</Button>
          </div>
        </DialogContent>
      </Dialog>
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="grid gap-4">
          {medicines.map((medicine) => {
            const isLowStock = medicine.stock <= medicine.low_stock_threshold;
            return (
              <Card key={medicine.id} className={`shadow-soft ${isLowStock ? 'border-warning/50' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`p-3 rounded-xl ${isLowStock ? 'bg-warning/20' : 'bg-primary/10'}`}><Pill className={`w-6 h-6 ${isLowStock ? 'text-warning' : 'text-primary'}`} /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-semibold text-lg">{medicine.name}</h3>{isLowStock && <AlertTriangle className="w-4 h-4 text-warning" />}</div>
                      <p className="text-sm text-muted-foreground">{medicine.category}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center"><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold">${Number(medicine.price).toFixed(2)}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Stock</p><p className={`font-semibold ${isLowStock ? 'text-warning' : ''}`}>{medicine.stock}</p></div>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedMedicine(medicine.id); setStockDialogOpen(true); }}><Package className="w-4 h-4 mr-1" />Stock</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
