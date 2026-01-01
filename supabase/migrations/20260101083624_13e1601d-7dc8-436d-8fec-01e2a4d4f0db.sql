-- Allow all clinic staff to read user_roles (needed for doctor dropdown in reception)
CREATE POLICY "Staff can view all user roles"
ON public.user_roles
FOR SELECT
USING (is_clinic_staff(auth.uid()));