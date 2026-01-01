import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUpdateVisitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      visitId, 
      doctorId, 
      roomNumber 
    }: { 
      visitId: string; 
      doctorId: string; 
      roomNumber: string;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({
          doctor_id: doctorId,
          room_number: roomNumber,
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
