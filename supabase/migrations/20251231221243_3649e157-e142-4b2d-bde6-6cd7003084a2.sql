-- Update the handle_new_user function to prevent admin self-signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role public.app_role;
  requested_role text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Get requested role from metadata
  requested_role := NEW.raw_user_meta_data ->> 'role';
  
  -- SECURITY: Never allow 'admin' role for self-signup
  -- Admin accounts can only be created by existing admins via staff management
  IF requested_role = 'admin' THEN
    user_role := 'reception'::public.app_role;
  ELSE
    user_role := COALESCE(
      requested_role::public.app_role,
      'reception'::public.app_role
    );
  END IF;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;