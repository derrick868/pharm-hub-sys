-- =============================================
-- Pharmacy Management System Database Export
-- Export Date: 2025-11-05
-- Source: Lovable Cloud
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES
-- =============================================

CREATE TYPE app_role AS ENUM ('admin', 'staff');

-- =============================================
-- 2. TABLES
-- =============================================

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Drugs Table
CREATE TABLE public.drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE NOT NULL,
  supplier_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sales Table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sale Items Table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  drug_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Assessments Table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  chief_complaint TEXT NOT NULL,
  history_present_illness TEXT,
  past_medical_history TEXT,
  review_of_systems TEXT,
  diagnosis TEXT,
  investigation TEXT,
  treatment TEXT,
  notes TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. FUNCTIONS
-- =============================================

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Assign default 'staff' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff');
  
  RETURN NEW;
END;
$function$;

-- =============================================
-- 4. TRIGGERS
-- =============================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at
  BEFORE UPDATE ON public.drugs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Suppliers Policies
CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Drugs Policies
CREATE POLICY "Authenticated users can view drugs"
  ON public.drugs
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can add drugs"
  ON public.drugs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update drugs"
  ON public.drugs
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage drugs"
  ON public.drugs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sales Policies
CREATE POLICY "Users can view their own sales"
  ON public.sales
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create sales"
  ON public.sales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sales"
  ON public.sales
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sale Items Policies
CREATE POLICY "Users can view sale items of their sales"
  ON public.sale_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sales
    WHERE sales.id = sale_items.sale_id
    AND sales.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can add sale items"
  ON public.sale_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales
    WHERE sales.id = sale_items.sale_id
    AND sales.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all sale items"
  ON public.sale_items
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Assessments Policies
CREATE POLICY "Admins can manage assessments"
  ON public.assessments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 6. INDEXES (Optional - for performance)
-- =============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_drugs_supplier_id ON public.drugs(supplier_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_drug_id ON public.sale_items(drug_id);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);
