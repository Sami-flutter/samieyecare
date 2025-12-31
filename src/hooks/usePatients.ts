import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: async () => {
      if (!query.trim()) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        return data as Patient[];
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
    enabled: true,
  });
}

export function useAddPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Omit<PatientInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
