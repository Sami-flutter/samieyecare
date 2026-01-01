import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMedicines, useAddMedicine, useUpdateMedicineStock } from '@/hooks/useMedicines';
import { useUpdateMedicine, useDeleteMedicine } from '@/hooks/useUpdateMedicine';
import { toast } from 'sonner';
import { Pill, Plus, Package, AlertTriangle, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Medicine = Database['public']['Tables']['medicines']['Row'];

export default function MedicineManagement() {
  const { data: medicines = [], isLoading } = useMedicines();
  const addMedicineMutation = useAddMedicine();
  const updateStockMutation = useUpdateMedicineStock();
  const updateMedicineMutation = useUpdateMedicine();
  const deleteMedicineMutation = useDeleteMedicine();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [stockChange, setStockChange] = useState('');
  const [newMedicine, setNewMedicine] = useState({ name: '', category: '', price: '', stock: '', lowStockThreshold: '10' });
  const [editForm, setEditForm] = useState({ name: '', category: '', price: '', stock: '', lowStockThreshold: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicine.name || !newMedicine.category || !newMedicine.price || !newMedicine.stock) {
      toast.error('Please fill all fields');
      return;
    }
    const price = parseFloat(newMedicine.price);
    const stock = parseInt(newMedicine.stock);
    if (price < 0 || stock < 0) {
      toast.error('Price and stock cannot be negative');
      return;
    }
    try {
      await addMedicineMutation.mutateAsync({
        name: newMedicine.name,
        category: newMedicine.category,
        price,
        stock,
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
      await updateStockMutation.mutateAsync({ medicineId: selectedMedicine.id, stockChange: parseInt(stockChange) });
      toast.success('Stock updated!');
      setStockDialogOpen(false);
      setSelectedMedicine(null);
      setStockChange('');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const openEditDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setEditForm({
      name: medicine.name,
      category: medicine.category,
      price: String(medicine.price),
      stock: String(medicine.stock),
      lowStockThreshold: String(medicine.low_stock_threshold),
    });
    setEditDialogOpen(true);
  };

  const handleEditMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    
    const price = parseFloat(editForm.price);
    const stock = parseInt(editForm.stock);
    const lowStockThreshold = parseInt(editForm.lowStockThreshold);
    
    if (price < 0 || stock < 0 || lowStockThreshold < 0) {
      toast.error('Values cannot be negative');
      return;
    }
    
    try {
      await updateMedicineMutation.mutateAsync({
        id: selectedMedicine.id,
        updates: {
          name: editForm.name,
          category: editForm.category,
          price,
          stock,
          low_stock_threshold: lowStockThreshold,
        },
      });
      toast.success('Medicine updated!');
      setEditDialogOpen(false);
      setSelectedMedicine(null);
    } catch (error) {
      toast.error('Failed to update medicine');
    }
  };

  const handleDeleteMedicine = async () => {
    if (!selectedMedicine) return;
    try {
      await deleteMedicineMutation.mutateAsync(selectedMedicine.id);
      toast.success('Medicine deleted!');
      setDeleteDialogOpen(false);
      setSelectedMedicine(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete medicine');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={newMedicine.price} onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Initial Stock</Label><Input type="number" min="0" value={newMedicine.stock} onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Low Stock Alert Threshold</Label><Input type="number" min="0" value={newMedicine.lowStockThreshold} onChange={(e) => setNewMedicine({ ...newMedicine, lowStockThreshold: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-primary" disabled={addMedicineMutation.isPending}>{addMedicineMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Medicine</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Search */}
      <div className="mb-4">
        <Input 
          placeholder="Search medicines..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Stock Update Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Stock - {selectedMedicine?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Quantity to Add (negative to subtract)</Label><Input type="number" placeholder="e.g., 50 or -10" value={stockChange} onChange={(e) => setStockChange(e.target.value)} /></div>
            <Button onClick={handleUpdateStock} className="w-full gradient-primary" disabled={updateStockMutation.isPending}>{updateStockMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Update Stock</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Medicine</DialogTitle></DialogHeader>
          <form onSubmit={handleEditMedicine} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price ($)</Label><Input type="number" step="0.01" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" min="0" value={editForm.lowStockThreshold} onChange={(e) => setEditForm({ ...editForm, lowStockThreshold: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={updateMedicineMutation.isPending}>
                {updateMedicineMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMedicine?.name}"? This action cannot be undone.
              If this medicine has been used in any sales or prescriptions, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMedicine}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMedicineMutation.isPending}
            >
              {deleteMedicineMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="grid gap-4">
          {filteredMedicines.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No medicines found</p>
                <p className="text-sm mt-1">Add medicines using the button above</p>
              </CardContent>
            </Card>
          ) : (
            filteredMedicines.map((medicine) => {
              const isLowStock = medicine.stock <= medicine.low_stock_threshold;
              return (
                <Card key={medicine.id} className={`shadow-soft ${isLowStock ? 'border-warning/50' : ''}`}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${isLowStock ? 'bg-warning/20' : 'bg-primary/10'}`}>
                        <Pill className={`w-6 h-6 ${isLowStock ? 'text-warning' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{medicine.name}</h3>
                          {isLowStock && <AlertTriangle className="w-4 h-4 text-warning shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{medicine.category}</p>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-semibold">${Number(medicine.price).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Stock</p>
                          <p className={`font-semibold ${isLowStock ? 'text-warning' : ''}`}>{medicine.stock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedMedicine(medicine); setStockDialogOpen(true); }}>
                            <Package className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Stock</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(medicine)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedMedicine(medicine); setDeleteDialogOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </AppShell>
  );
}
