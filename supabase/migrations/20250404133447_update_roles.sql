-- First, clear existing roles
TRUNCATE TABLE roles CASCADE;

-- Insert the correct roles
INSERT INTO roles (id, name, created_at) VALUES
  (gen_random_uuid(), 'SEO Specialist', NOW()),
  (gen_random_uuid(), 'Editor', NOW()),
  (gen_random_uuid(), 'Culinary Specialist', NOW()),
  (gen_random_uuid(), 'Legal Specialist', NOW()),
  (gen_random_uuid(), 'Brand Member', NOW()),
  (gen_random_uuid(), 'Publisher', NOW()),
  (gen_random_uuid(), 'Project Manager', NOW());

-- Add display_name column to brand_roles
ALTER TABLE brand_roles ADD COLUMN IF NOT EXISTS display_name text; 