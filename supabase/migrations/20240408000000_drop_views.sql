-- Drop all views first
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP VIEW IF EXISTS user_roles CASCADE;

-- Drop all related tables
DROP TABLE IF EXISTS user_brand_access CASCADE;
DROP TABLE IF EXISTS user_roles_table CASCADE; 