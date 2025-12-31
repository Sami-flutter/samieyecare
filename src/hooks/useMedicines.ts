import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Medicine = Database['public']['Tables']['medicines']['Row'];
type MedicineInsert = Database['public']['Tables']['medicines']['Insert'];

export function useMedicines() {
  return useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Medicine[];
    },
  });
}

export function useLowStockMedicines() {
  return useQuery({
    queryKey: ['medicines', 'low_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('stock', { ascending: true });

      if (error) throw error;
      // Filter client-side since we need to compare stock with low_stock_threshold
      return (data as Medicine[]).filter(m => m.stock <= m.low_stock_threshold);
    },
  });
}

export function useAddMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicine: Omit<MedicineInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('medicines')
        .insert(medicine)
        .select()
        .single();

      if (error) throw error;
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}

export function useUpdateMedicineStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ medicineId, stockChange }: { medicineId: string; stockChange: number }) => {
      // Get current stock first
      const { data: current, error: fetchError } = await supabase
        .from('medicines')
        .select('stock')
        .eq('id', medicineId)
        .single();

      if (fetchError) throw fetchError;

      const newStock = Math.max(0, (current?.stock ?? 0) + stockChange);

      const { data, error } = await supabase
        .from('medicines')
        .update({ stock: newStock })
        .eq('id', medicineId)
        .select()
        .single();

      if (error) throw error;
      return data as Medicine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}
