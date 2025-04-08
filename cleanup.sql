-- First, disable row level security (RLS) triggers
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Drop all foreign key constraints first
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
    ) 
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- Drop views
DROP VIEW IF EXISTS public.user_permissions_view CASCADE;

-- Drop tables
DROP TABLE IF EXISTS public.user_brand_access CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.content CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any remaining types
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Clean up storage
DELETE FROM storage.objects WHERE bucket_id IN (
    SELECT id FROM storage.buckets WHERE name = 'brand-logos'
);
DELETE FROM storage.buckets WHERE name = 'brand-logos';

-- Reset RLS
ALTER PUBLICATION supabase_realtime OWNER TO postgres; 