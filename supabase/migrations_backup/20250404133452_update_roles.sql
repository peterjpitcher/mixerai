-- First, clear existing roles
TRUNCATE TABLE roles CASCADE;

-- Insert the correct roles
INSERT INTO roles (name, permissions) VALUES
  ('SEO Specialist', ARRAY['create_content', 'edit_own_content']),
  ('Editor', ARRAY['edit_content', 'approve_content', 'reject_content']),
  ('Culinary Specialist', ARRAY['create_content', 'edit_own_content']),
  ('Legal Specialist', ARRAY['review_content', 'approve_content']),
  ('Brand Member', ARRAY['view_content']),
  ('Publisher', ARRAY['publish_content']),
  ('Project Manager', ARRAY['manage_content', 'assign_tasks']); 