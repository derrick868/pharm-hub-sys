-- Add UPDATE and DELETE policies for sales table
CREATE POLICY "Admins can update sales"
ON public.sales
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sales"
ON public.sales
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE and DELETE policies for sale_items table
CREATE POLICY "Admins can update sale items"
ON public.sale_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sale items"
ON public.sale_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));