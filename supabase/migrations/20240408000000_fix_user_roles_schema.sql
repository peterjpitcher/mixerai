-- Drop views first to avoid conflicts
DROP VIEW IF EXISTS user_permissions_view;
DROP VIEW IF EXISTS user_roles;

-- Drop tables if they exist
DROP TABLE IF EXISTS user_brand_access CASCADE;
DROP TABLE IF EXISTS user_roles_table CASCADE;

-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the base table for user roles
CREATE TABLE user_roles_table (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    accessible_brand_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_name)
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
    BEFORE UPDATE ON user_roles_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_brand_access_updated_at
    BEFORE UPDATE ON user_brand_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_roles_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own roles"
    ON user_roles_table FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
    ON user_roles_table FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles_table
            WHERE user_id = auth.uid()
            AND role_name = 'super_admin'
        )
    );

CREATE POLICY "Users can view their brand access"
    ON user_brand_access FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all brand access"
    ON user_brand_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles_table
            WHERE user_id = auth.uid()
            AND role_name = 'super_admin'
        )
    );

-- Create the user_roles view
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    id,
    user_id,
    role_name,
    permissions,
    accessible_brand_names,
    created_at,
    updated_at
FROM user_roles_table;

-- Create the permissions view
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.email,
    r.role_name,
    r.permissions,
    r.accessible_brand_names,
    ba.brand_id,
    ba.access_level
FROM auth.users u
LEFT JOIN user_roles_table r ON u.id = r.user_id
LEFT JOIN user_brand_access ba ON u.id = ba.user_id;

-- Insert super admin role for current user if it doesn't exist
INSERT INTO user_roles_table (user_id, role_name, permissions)
SELECT 
    auth.uid(),
    'super_admin',
    '{"all": true}'::jsonb
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM user_roles_table 
        WHERE user_id = auth.uid() 
        AND role_name = 'super_admin'
    )
AND auth.uid() IS NOT NULL; 