-- Create user roles table and authentication setup
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if the email is admin email
  IF NEW.email = 'info@dkenterprises.co.in' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for existing tables to be more restrictive
-- Categories table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.categories;
CREATE POLICY "Admin full access to categories" 
ON public.categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read categories" 
ON public.categories 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Item master table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.item_master;
CREATE POLICY "Admin full access to item_master" 
ON public.item_master 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read item_master" 
ON public.item_master 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Stock table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.stock;
CREATE POLICY "Admin full access to stock" 
ON public.stock 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read stock" 
ON public.stock 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- GRN log table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.grn_log;
CREATE POLICY "Admin full access to grn_log" 
ON public.grn_log 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read grn_log" 
ON public.grn_log 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Issue log table
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.issue_log;
CREATE POLICY "Admin full access to issue_log" 
ON public.issue_log 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read issue_log" 
ON public.issue_log 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create CSV upload log table for tracking imports
CREATE TABLE public.csv_upload_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    success_rows INTEGER NOT NULL,
    error_rows INTEGER NOT NULL,
    errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.csv_upload_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to csv_upload_log" 
ON public.csv_upload_log 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert admin role for the specified email if user exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@dkenterprises.co.in') THEN
        INSERT INTO public.user_roles (user_id, role)
        SELECT id, 'admin'
        FROM auth.users 
        WHERE email = 'info@dkenterprises.co.in'
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- Add trigger to update timestamps
CREATE TRIGGER update_user_roles_timestamp
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();