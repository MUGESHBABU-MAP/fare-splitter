-- Add split_type and split_data columns to expenses table
ALTER TABLE public.expenses 
ADD COLUMN split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'weight')),
ADD COLUMN split_data JSONB DEFAULT '{}'::jsonb;