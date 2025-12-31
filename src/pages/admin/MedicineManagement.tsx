import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useClinicData } from '@/contexts/ClinicDataContext';
import { toast } from 'sonner';
import { Pill, Plus, Package, AlertTriangle } from 'lucide-react';

export default function MedicineManagement() {
  const { medicines, addMedicine, updateMedicineStock } = useClinicData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [stockChange, setStockChange] = useState('');
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    lowStockThreshold: '10',
  });

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicine.name || !newMedicine.category || !newMedicine.price || !newMedicine.stock) {
      toast.error('Please fill in all fields');
      return;
    }

    addMedicine({
      name: newMedicine.name,
      category: newMedicine.category,
      price: parseFloat(newMedicine.price),
      stock: parseInt(newMedicine.stock),
      lowStockThreshold: parseInt(newMedicine.lowStockThreshold),
    });

    toast.success('Medicine added successfully!');
    setDialogOpen(false);
    setNewMedicine({ name: '', category: '', price: '', stock: '', lowStockThreshold: '10' });
  };

  const handleUpdateStock = () => {
    if (!selectedMedicine || !stockChange) return;
    
    updateMedicineStock(selectedMedicine, parseInt(stockChange));
    toast.success('Stock updated successfully!');
    setStockDialogOpen(false);
    setSelectedMedicine(null);
    setStockChange('');
  };

  return (
    <AppShell>
      <PageHeader title="Medicine Management" description="Manage medicine inventory">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMedicine} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Medicine name"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Eye Drops, Antibiotics"
                  value={newMedicine.category}
                  onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newMedicine.price}
                    onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newMedicine.stock}
                    onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newMedicine.lowStockThreshold}
                  onChange={(e) => setNewMedicine({ ...newMedicine, lowStockThreshold: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary">Add Medicine</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stock Update Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Quantity to Add (use negative to subtract)</Label>
              <Input
                type="number"
                placeholder="e.g., 50 or -10"
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
              />
            </div>
            <Button onClick={handleUpdateStock} className="w-full gradient-primary">Update Stock</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medicine List */}
      <div className="grid gap-4">
        {medicines.map((medicine) => {
          const isLowStock = medicine.stock <= medicine.lowStockThreshold;
          
          return (
            <Card key={medicine.id} className={`shadow-soft ${isLowStock ? 'border-warning/50' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`p-3 rounded-xl ${isLowStock ? 'bg-warning/20' : 'bg-primary/10'}`}>
                    <Pill className={`w-6 h-6 ${isLowStock ? 'text-warning' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{medicine.name}</h3>
                      {isLowStock && <AlertTriangle className="w-4 h-4 text-warning" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{medicine.category}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-semibold">${medicine.price.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className={`font-semibold ${isLowStock ? 'text-warning' : ''}`}>{medicine.stock}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMedicine(medicine.id);
                        setStockDialogOpen(true);
                      }}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Stock
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
