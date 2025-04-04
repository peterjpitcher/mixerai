-- Create user_permissions_view
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  p.id as user_id,
  r.name as role_name,
  r.permissions,
  ARRAY(
    SELECT b.name 
    FROM brands b
    JOIN user_brand_access uba ON uba.brand_id = b.id
    WHERE uba.user_id = p.id
  ) as accessible_brand_names
FROM profiles p
JOIN roles r ON p.role_id = r.id;

-- Grant access to authenticated users
ALTER VIEW user_permissions_view OWNER TO postgres;
GRANT SELECT ON user_permissions_view TO authenticated;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Create user_brand_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_brand_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(user_id, brand_id)
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
('admin', ARRAY['all']),
('brand_approver', ARRAY['approve_brands', 'view_brands']),
('content_editor', ARRAY['edit_content', 'view_content']),
('viewer', ARRAY['view_content'])
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Allow read access to all authenticated users" 
ON roles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all access to admin users" 
ON roles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_permissions_view
    WHERE user_id = auth.uid()
    AND 'all' = ANY(permissions)
  )
);

-- User brand access policies
CREATE POLICY "Allow read access to all authenticated users" 
ON user_brand_access FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all access to admin users" 
ON user_brand_access FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_permissions_view
    WHERE user_id = auth.uid()
    AND 'all' = ANY(permissions)
  )
); 