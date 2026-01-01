import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Visit = Database['public']['Tables']['visits']['Row'];
type VisitInsert = Database['public']['Tables']['visits']['Insert'];
export type VisitStatus = 'registered' | 'waiting' | 'eye_measurement' | 'with_doctor' | 'in_consultation' | 'prescribed' | 'pharmacy' | 'completed';
type PaymentMethod = Database['public']['Enums']['payment_method'];

export interface VisitWithPatient extends Visit {
  patients: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: Database['public']['Enums']['gender'];
  } | null;
  doctor?: {
    id: string;
    name: string;
  } | null;
}

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`*, patients(id, name, phone, age, gender), doctor:profiles!visits_doctor_id_fkey(id, name)`)
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
        .select(`*, patients(id, name, phone, age, gender), doctor:profiles!visits_doctor_id_fkey(id, name)`)
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
        .select(`*, patients(id, name, phone, age, gender), doctor:profiles!visits_doctor_id_fkey(id, name)`)
        .eq('status', status as any)
        .gte('created_at', today.toISOString())
        .order('queue_number', { ascending: true });

      if (error) throw error;
      return data as VisitWithPatient[];
    },
  });
}

export function useVisitsByDoctor(doctorId: string | null) {
  return useQuery({
    queryKey: ['visits', 'doctor', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('visits')
        .select(`*, patients(id, name, phone, age, gender), doctor:profiles!visits_doctor_id_fkey(id, name)`)
        .eq('doctor_id', doctorId)
        .gte('created_at', today.toISOString())
        .in('status', ['waiting', 'with_doctor', 'in_consultation'])
        .order('queue_number', { ascending: true });

      if (error) throw error;
      return data as VisitWithPatient[];
    },
    enabled: !!doctorId,
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      patientId, 
      doctorId, 
      roomNumber 
    }: { 
      patientId: string; 
      doctorId?: string; 
      roomNumber?: string;
    }) => {
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
        .insert([{
          patient_id: patientId,
          queue_number: nextQueueNumber,
          status: 'waiting',
          doctor_id: doctorId || null,
          room_number: roomNumber || null,
        }] as any)
        .select(`*, patients(id, name, phone, age, gender), doctor:profiles!visits_doctor_id_fkey(id, name)`)
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
      const updateData: Record<string, unknown> = { status };
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
