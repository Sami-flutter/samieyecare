import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface CreateStaffData {
  email: string;
  password: string;
  name: string;
  role: AppRole;
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffData) => {
      // Use supabase auth to create user with metadata
      // The handle_new_user trigger will create profile and role
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { 
            name: data.name, 
            role: data.role 
          },
        },
      });

      if (error) throw error;
      
      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // We can't actually delete auth users from client-side
      // Instead, we'll just remove their role (deactivate)
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useResetPasswordRequest() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    },
  });
}
