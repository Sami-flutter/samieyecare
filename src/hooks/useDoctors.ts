import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  id: string;
  name: string;
  email: string;
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      // Get all users with doctor role
      const { data: doctorRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'doctor');

      if (rolesError) throw rolesError;

      const doctorIds = doctorRoles?.map(r => r.user_id) || [];

      if (doctorIds.length === 0) return [];

      // Get profiles for doctors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', doctorIds)
        .order('name');

      if (profilesError) throw profilesError;

      return profiles as Doctor[];
    },
  });
}
