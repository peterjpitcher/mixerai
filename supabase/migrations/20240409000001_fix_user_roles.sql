-- Drop existing user_roles related objects
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create user_roles table with correct structure
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    accessible_brand_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- Create user_permissions_view
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    ur.role_name,
    ur.permissions,
    ur.accessible_brand_names
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id;

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admin users can manage all roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role_name = 'admin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);

-- Insert admin role for the first user if it doesn't exist
INSERT INTO user_roles (user_id, role_name, permissions, accessible_brand_names)
SELECT 
    id as user_id,
    'admin' as role_name,
    '{"*": true}'::jsonb as permissions,
    '{}'::text[] as accessible_brand_names
FROM auth.users
WHERE email = 'peter.pitcher@genmills.com'
ON CONFLICT (user_id, role_name) DO NOTHING; 