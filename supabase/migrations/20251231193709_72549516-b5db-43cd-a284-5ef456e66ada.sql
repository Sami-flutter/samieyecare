-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('reception', 'eye_measurement', 'doctor', 'pharmacy', 'admin');

-- Create enum for visit status
CREATE TYPE public.visit_status AS ENUM ('waiting', 'eye_measurement', 'with_doctor', 'pharmacy', 'completed');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile');

-- Create enum for gender
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender gender NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  queue_number INTEGER NOT NULL,
  status visit_status NOT NULL DEFAULT 'waiting',
  payment_method payment_method,
  payment_amount NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Eye measurements table
CREATE TABLE public.eye_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  visual_acuity_right TEXT,
  visual_acuity_left TEXT,
  right_sph NUMERIC(5, 2),
  right_cyl NUMERIC(5, 2),
  right_axis INTEGER,
  left_sph NUMERIC(5, 2),
  left_cyl NUMERIC(5, 2),
  left_axis INTEGER,
  pd NUMERIC(5, 2),
  iop_right NUMERIC(5, 2),
  iop_left NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  diagnosis TEXT NOT NULL,
  follow_up_note TEXT,
  dispensed BOOLEAN NOT NULL DEFAULT false,
  dispensed_at TIMESTAMP WITH TIME ZONE,
  dispensed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Prescription medicines (junction table)
CREATE TABLE public.prescription_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) NOT NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  dosage TEXT NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eye_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any clinic role
CREATE OR REPLACE FUNCTION public.is_clinic_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Profile policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Patient policies (all clinic staff can access)
CREATE POLICY "Staff can view patients"
  ON public.patients FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Reception and admin can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'reception') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reception and admin can update patients"
  ON public.patients FOR UPDATE
  USING (public.has_role(auth.uid(), 'reception') OR public.has_role(auth.uid(), 'admin'));

-- Visit policies
CREATE POLICY "Staff can view visits"
  ON public.visits FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Reception can create visits"
  ON public.visits FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'reception') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update visits"
  ON public.visits FOR UPDATE
  USING (public.is_clinic_staff(auth.uid()));

-- Eye measurement policies
CREATE POLICY "Staff can view eye measurements"
  ON public.eye_measurements FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Eye measurement staff can insert"
  ON public.eye_measurements FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'eye_measurement') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Eye measurement staff can update"
  ON public.eye_measurements FOR UPDATE
  USING (public.has_role(auth.uid(), 'eye_measurement') OR public.has_role(auth.uid(), 'admin'));

-- Medicine policies
CREATE POLICY "Staff can view medicines"
  ON public.medicines FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Admin and pharmacy can manage medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pharmacy'));

CREATE POLICY "Admin and pharmacy can update medicines"
  ON public.medicines FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'pharmacy'));

-- Prescription policies
CREATE POLICY "Staff can view prescriptions"
  ON public.prescriptions FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors and pharmacy can update prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'pharmacy') OR public.has_role(auth.uid(), 'admin'));

-- Prescription medicines policies
CREATE POLICY "Staff can view prescription medicines"
  ON public.prescription_medicines FOR SELECT
  USING (public.is_clinic_staff(auth.uid()));

CREATE POLICY "Doctors can add prescription medicines"
  ON public.prescription_medicines FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_created_at ON public.visits(created_at);
CREATE INDEX idx_eye_measurements_visit_id ON public.eye_measurements(visit_id);
CREATE INDEX idx_prescriptions_visit_id ON public.prescriptions(visit_id);
CREATE INDEX idx_prescription_medicines_prescription_id ON public.prescription_medicines(prescription_id);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);