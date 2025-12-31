import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Prescription = Database['public']['Tables']['prescriptions']['Row'];
type PrescriptionMedicine = Database['public']['Tables']['prescription_medicines']['Row'];

export interface PrescriptionWithMedicines extends Prescription {
  prescription_medicines: PrescriptionMedicine[];
}

export function usePrescriptionByVisit(visitId: string | null) {
  return useQuery({
    queryKey: ['prescriptions', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`*, prescription_medicines(*)`)
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) throw error;
      return data as PrescriptionWithMedicines | null;
    },
    enabled: !!visitId,
  });
}

export function usePendingPrescriptions() {
  return useQuery({
    queryKey: ['prescriptions', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medicines(*),
          visits!inner(
            id,
            queue_number,
            patient_id,
            patients(id, name, phone)
          )
        `)
        .eq('dispensed', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useAddPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      diagnosis,
      followUpNote,
      createdBy,
      medicines,
    }: {
      visitId: string;
      diagnosis: string;
      followUpNote?: string;
      createdBy: string;
      medicines: { medicineId: string; medicineName: string; quantity: number; dosage: string }[];
    }) => {
      // Create prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          visit_id: visitId,
          diagnosis,
          follow_up_note: followUpNote,
          created_by: createdBy,
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Add prescription medicines
      if (medicines.length > 0) {
        const { error: medicinesError } = await supabase
          .from('prescription_medicines')
          .insert(
            medicines.map((med) => ({
              prescription_id: prescription.id,
              medicine_id: med.medicineId,
              medicine_name: med.medicineName,
              quantity: med.quantity,
              dosage: med.dosage,
            }))
          );

        if (medicinesError) throw medicinesError;
      }

      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prescriptionId,
      dispensedBy,
      medicines,
    }: {
      prescriptionId: string;
      dispensedBy: string;
      medicines: { medicineId: string; quantity: number }[];
    }) => {
      // Update prescription as dispensed
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .update({
          dispensed: true,
          dispensed_at: new Date().toISOString(),
          dispensed_by: dispensedBy,
        })
        .eq('id', prescriptionId)
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Reduce stock for each medicine
      for (const med of medicines) {
        const { data: current, error: fetchError } = await supabase
          .from('medicines')
          .select('stock')
          .eq('id', med.medicineId)
          .single();

        if (fetchError) throw fetchError;

        const newStock = Math.max(0, (current?.stock ?? 0) - med.quantity);

        const { error: updateError } = await supabase
          .from('medicines')
          .update({ stock: newStock })
          .eq('id', med.medicineId);

        if (updateError) throw updateError;
      }

      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
}
