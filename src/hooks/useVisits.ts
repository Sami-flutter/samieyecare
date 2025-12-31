import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Visit = Database['public']['Tables']['visits']['Row'];
type VisitInsert = Database['public']['Tables']['visits']['Insert'];
type VisitStatus = Database['public']['Enums']['visit_status'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

export interface VisitWithPatient extends Visit {
  patients: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: Database['public']['Enums']['gender'];
  } | null;
}

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`*, patients(id, name, phone, age, gender)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useTodayVisits() {
  return useQuery({
    queryKey: ['visits', 'today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('visits')
        .select(`*, patients(id, name, phone, age, gender)`)
        .gte('created_at', today.toISOString())
        .order('queue_number', { ascending: true });

      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useVisitsByStatus(status: VisitStatus) {
  return useQuery({
    queryKey: ['visits', 'status', status],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('visits')
        .select(`*, patients(id, name, phone, age, gender)`)
        .eq('status', status)
        .gte('created_at', today.toISOString())
        .order('queue_number', { ascending: true });

      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      // Get next queue number for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: lastVisit } = await supabase
        .from('visits')
        .select('queue_number')
        .gte('created_at', today.toISOString())
        .order('queue_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextQueueNumber = (lastVisit?.queue_number ?? 0) + 1;

      const { data, error } = await supabase
        .from('visits')
        .insert({
          patient_id: patientId,
          queue_number: nextQueueNumber,
          status: 'waiting',
        })
        .select(`*, patients(id, name, phone, age, gender)`)
        .single();

      if (error) throw error;
      return data as VisitWithPatient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ visitId, status }: { visitId: string; status: VisitStatus }) => {
      const updateData: Partial<Visit> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      visitId, 
      paymentMethod, 
      paymentAmount 
    }: { 
      visitId: string; 
      paymentMethod: PaymentMethod; 
      paymentAmount: number 
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({
          payment_method: paymentMethod,
          payment_amount: paymentAmount,
        })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}
