-- Remove RLS from all tables
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations during development" ON roles;
DROP POLICY IF EXISTS "Allow all operations during development" ON brand_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON brand_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users with admin access" ON brand_roles;
DROP POLICY IF EXISTS "Enable update for authenticated users with admin access" ON brand_roles;
DROP POLICY IF EXISTS "Enable delete for authenticated users with admin access" ON brand_roles;

-- Ensure brand_roles columns exist and are properly typed
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_roles' AND column_name = 'email') THEN
        ALTER TABLE brand_roles ADD COLUMN email text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_roles' AND column_name = 'is_compulsory') THEN
        ALTER TABLE brand_roles ADD COLUMN is_compulsory boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_roles' AND column_name = 'order') THEN
        ALTER TABLE brand_roles ADD COLUMN "order" integer DEFAULT 0;
    END IF;
END $$; 