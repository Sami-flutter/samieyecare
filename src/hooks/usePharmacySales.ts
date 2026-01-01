import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export interface PharmacySale {
  id: string;
  prescription_id: string;
  visit_id: string;
  patient_id: string;
  total_amount: number;
  payment_method: PaymentMethod | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  created_by: string;
}

export interface PharmacySaleItem {
  id: string;
  sale_id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SaleWithItems extends PharmacySale {
  pharmacy_sale_items: PharmacySaleItem[];
  patients?: { name: string; phone: string } | null;
  visits?: { queue_number: number } | null;
}

export function useTodayPharmacySales() {
  return useQuery({
    queryKey: ['pharmacy_sales', 'today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('pharmacy_sales')
        .select(`
          *,
          pharmacy_sale_items(*),
          patients(name, phone),
          visits(queue_number)
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SaleWithItems[];
    },
  });
}

export function useAllPharmacySales() {
  return useQuery({
    queryKey: ['pharmacy_sales', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_sales')
        .select(`
          *,
          pharmacy_sale_items(*),
          patients(name, phone),
          visits(queue_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SaleWithItems[];
    },
  });
}

export function useCreatePharmacySale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prescriptionId,
      visitId,
      patientId,
      createdBy,
      items,
      paymentMethod,
    }: {
      prescriptionId: string;
      visitId: string;
      patientId: string;
      createdBy: string;
      items: { medicineId: string; medicineName: string; quantity: number; unitPrice: number }[];
      paymentMethod?: PaymentMethod;
    }) => {
      const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('pharmacy_sales')
        .insert({
          prescription_id: prescriptionId,
          visit_id: visitId,
          patient_id: patientId,
          total_amount: totalAmount,
          payment_method: paymentMethod || null,
          paid: !!paymentMethod,
          paid_at: paymentMethod ? new Date().toISOString() : null,
          created_by: createdBy,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const { error: itemsError } = await supabase
        .from('pharmacy_sale_items')
        .insert(
          items.map(item => ({
            sale_id: sale.id,
            medicine_id: item.medicineId,
            medicine_name: item.medicineName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
          }))
        );

      if (itemsError) throw itemsError;

      // Reduce stock for each medicine
      for (const item of items) {
        const { data: current, error: fetchError } = await supabase
          .from('medicines')
          .select('stock')
          .eq('id', item.medicineId)
          .single();

        if (fetchError) throw fetchError;

        const newStock = Math.max(0, (current?.stock ?? 0) - item.quantity);

        const { error: updateError } = await supabase
          .from('medicines')
          .update({ stock: newStock })
          .eq('id', item.medicineId);

        if (updateError) throw updateError;
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy_sales'] });
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}
