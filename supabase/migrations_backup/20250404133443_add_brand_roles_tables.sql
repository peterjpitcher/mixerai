-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create brand_roles junction table
CREATE TABLE IF NOT EXISTS brand_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    emails TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_compulsory BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(brand_id, role_name)
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
    ('SEO Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Editor', ARRAY['edit_content', 'approve_content', 'reject_content']),
    ('Culinary Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Legal Specialist', ARRAY['review_content', 'approve_content']),
    ('Brand Member', ARRAY['view_content']),
    ('Publisher', ARRAY['publish_content']),
    ('Project Manager', ARRAY['manage_content', 'assign_tasks']);

-- Add RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_roles ENABLE ROW LEVEL SECURITY;

-- During development, allow all operations
CREATE POLICY "Allow all operations during development" ON roles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations during development" ON brand_roles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_brand_roles_brand_id ON brand_roles(brand_id);
CREATE INDEX idx_brand_roles_role_name ON brand_roles(role_name);
CREATE INDEX idx_brand_roles_order ON brand_roles("order");
