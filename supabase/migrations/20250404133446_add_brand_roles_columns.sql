-- Add missing columns to brand_roles table
ALTER TABLE brand_roles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE brand_roles ADD COLUMN IF NOT EXISTS is_compulsory boolean DEFAULT false;
ALTER TABLE brand_roles ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_roles_order ON brand_roles("order");

-- Disable RLS
ALTER TABLE brand_roles DISABLE ROW LEVEL SECURITY; 