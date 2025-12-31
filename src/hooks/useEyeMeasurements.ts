import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type EyeMeasurement = Database['public']['Tables']['eye_measurements']['Row'];
type EyeMeasurementInsert = Database['public']['Tables']['eye_measurements']['Insert'];

export function useEyeMeasurementByVisit(visitId: string | null) {
  return useQuery({
    queryKey: ['eye_measurements', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('eye_measurements')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error) throw error;
      return data as EyeMeasurement | null;
    },
    enabled: !!visitId,
  });
}

export function useAddEyeMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurement: EyeMeasurementInsert) => {
      const { data, error } = await supabase
        .from('eye_measurements')
        .insert(measurement)
        .select()
        .single();

      if (error) throw error;
      return data as EyeMeasurement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eye_measurements'] });
      queryClient.invalidateQueries({ queryKey: ['eye_measurements', data.visit_id] });
    },
  });
}
