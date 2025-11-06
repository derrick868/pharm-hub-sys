-- Add missing foreign key constraint for sales.user_id
ALTER TABLE public.sales
ADD CONSTRAINT sales_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;