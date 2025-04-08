-- Drop views first
DROP VIEW IF EXISTS user_permissions_view;

-- Drop tables
DROP TABLE IF EXISTS user_brand_access;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create user_roles table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role)
);

-- Create user_brand_access table
CREATE TABLE user_brand_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, brand_id)
);

-- Add triggers for updating timestamps
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_brand_access_updated_at
    BEFORE UPDATE ON user_brand_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
    ON user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Users can view their brand access"
    ON user_brand_access FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all brand access"
    ON user_brand_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Create the permissions view
CREATE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.email,
    r.role,
    r.permissions,
    ba.brand_id,
    ba.access_level
FROM auth.users u
LEFT JOIN user_roles r ON u.id = r.user_id
LEFT JOIN user_brand_access ba ON u.id = ba.user_id;

-- Insert super admin role for current user if it doesn't exist
INSERT INTO user_roles (user_id, role, permissions)
SELECT 
    auth.uid(),
    'super_admin',
    '{"all": true}'::jsonb
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
AND auth.uid() IS NOT NULL; 