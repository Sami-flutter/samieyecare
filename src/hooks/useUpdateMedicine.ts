import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Medicine = Database['public']['Tables']['medicines']['Row'];
type MedicineUpdate = Database['public']['Tables']['medicines']['Update'];

export function useUpdateMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MedicineUpdate }) => {
      const { data, error } = await supabase
        .from('medicines')
        .update(updates)
        .eq('id', id)
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

export function useDeleteMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicineId: string) => {
      // Check if medicine is used in any sales
      const { data: salesItems, error: checkError } = await supabase
        .from('pharmacy_sale_items')
        .select('id')
        .eq('medicine_id', medicineId)
        .limit(1);

      if (checkError) throw checkError;

      if (salesItems && salesItems.length > 0) {
        throw new Error('Cannot delete: Medicine is referenced in existing sales. Consider updating stock to 0 instead.');
      }

      // Check if medicine is used in any prescriptions
      const { data: prescriptionItems, error: prescriptionCheckError } = await supabase
        .from('prescription_medicines')
        .select('id')
        .eq('medicine_id', medicineId)
        .limit(1);

      if (prescriptionCheckError) throw prescriptionCheckError;

      if (prescriptionItems && prescriptionItems.length > 0) {
        throw new Error('Cannot delete: Medicine is referenced in existing prescriptions. Consider updating stock to 0 instead.');
      }

      // Safe to delete
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', medicineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}
