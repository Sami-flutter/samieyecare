-- 1) Extend visit_status enum with new statuses
-- Need to add: registered, in_consultation, prescribed
ALTER TYPE public.visit_status ADD VALUE IF NOT EXISTS 'registered';
ALTER TYPE public.visit_status ADD VALUE IF NOT EXISTS 'in_consultation';
ALTER TYPE public.visit_status ADD VALUE IF NOT EXISTS 'prescribed';

-- 2) Add doctor_id and room_number to visits table
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS room_number text;

-- 3) Add buy_from_clinic flag to prescriptions
ALTER TABLE public.prescriptions
ADD COLUMN IF NOT EXISTS buy_from_clinic boolean NOT NULL DEFAULT true;

-- 4) Create pharmacy_sales table for invoicing
CREATE TABLE IF NOT EXISTS public.pharmacy_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) NOT NULL,
  visit_id uuid REFERENCES public.visits(id) NOT NULL,
  patient_id uuid REFERENCES public.patients(id) NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_method public.payment_method,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) NOT NULL
);

-- 5) Create pharmacy_sale_items table for individual medicine items
CREATE TABLE IF NOT EXISTS public.pharmacy_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE NOT NULL,
  medicine_id uuid REFERENCES public.medicines(id) NOT NULL,
  medicine_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL
);

-- 6) Enable RLS on new tables
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

-- 7) RLS policies for pharmacy_sales
CREATE POLICY "Staff can view pharmacy sales"
ON public.pharmacy_sales
FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Pharmacy can create sales"
ON public.pharmacy_sales
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Pharmacy can update sales"
ON public.pharmacy_sales
FOR UPDATE
USING (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 8) RLS policies for pharmacy_sale_items
CREATE POLICY "Staff can view sale items"
ON public.pharmacy_sale_items
FOR SELECT
USING (is_clinic_staff(auth.uid()));

CREATE POLICY "Pharmacy can create sale items"
ON public.pharmacy_sale_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 9) Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON public.visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_created_at ON public.pharmacy_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_visit_id ON public.pharmacy_sales(visit_id);