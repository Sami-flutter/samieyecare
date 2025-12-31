-- Allow users to assign themselves a non-admin role at signup
CREATE POLICY "Users can add their own non-admin role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role <> 'admin'::public.app_role
);