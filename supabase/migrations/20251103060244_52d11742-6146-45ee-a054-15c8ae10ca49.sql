-- Drop the existing foreign key that points to auth.users
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;

-- Add foreign key to profiles table instead
ALTER TABLE public.sales 
ADD CONSTRAINT sales_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;