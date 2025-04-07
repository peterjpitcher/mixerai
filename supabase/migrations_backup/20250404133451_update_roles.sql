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