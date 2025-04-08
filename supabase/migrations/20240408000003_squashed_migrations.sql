-- Drop existing objects first to avoid conflicts
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP VIEW IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS brand_roles CASCADE;
DROP TABLE IF EXISTS user_brand_access CASCADE;
DROP TABLE IF EXISTS user_roles_table CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;

-- Create the brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    language TEXT NOT NULL,
    country TEXT NOT NULL,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brand_roles junction table
CREATE TABLE IF NOT EXISTS brand_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    email TEXT,
    is_compulsory BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, role_name)
);

-- Create user_roles_table
CREATE TABLE IF NOT EXISTS user_roles_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    accessible_brand_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- Create user_brand_access table
CREATE TABLE IF NOT EXISTS user_brand_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- Create content table
CREATE TABLE IF NOT EXISTS content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    brand_id UUID REFERENCES brands(id),
    content_type TEXT NOT NULL,
    primary_keyword TEXT,
    secondary_keywords TEXT[],
    content TEXT,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES auth.users(id),
    seo_title TEXT,
    seo_description TEXT,
    meta_keywords TEXT[],
    approval_stage TEXT,
    approval_status TEXT DEFAULT 'pending',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id),
    role TEXT DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, brand_id)
);

-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_settings ON brands USING gin (settings);
CREATE INDEX IF NOT EXISTS idx_brand_roles_brand_id ON brand_roles(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_roles_role_name ON brand_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_brand_roles_order ON brand_roles("order");
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles_table(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_user_id ON user_brand_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_brand_id ON user_brand_access(brand_id);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own brands"
    ON brands FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brands"
    ON brands FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
    ON brands FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
    ON brands FOR DELETE
    USING (auth.uid() = user_id);

-- Storage policies for brand logos
CREATE POLICY "Anyone can view brand logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can upload brand logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-logos' AND
        auth.role() = 'authenticated'
    );

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
    ('SEO Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Editor', ARRAY['edit_content', 'approve_content', 'reject_content']),
    ('Culinary Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Legal Specialist', ARRAY['review_content', 'approve_content']),
    ('Brand Member', ARRAY['view_content']),
    ('Publisher', ARRAY['publish_content']),
    ('Project Manager', ARRAY['manage_content', 'assign_tasks'])
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_roles_updated_at
    BEFORE UPDATE ON brand_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_brand_access_updated_at
    BEFORE UPDATE ON user_brand_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create brand status change notification trigger
CREATE OR REPLACE FUNCTION handle_brand_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        )
        VALUES (
            NEW.user_id,
            'brand_' || NEW.status,
            CASE
                WHEN NEW.status = 'approved' THEN 'Brand Approved'
                WHEN NEW.status = 'rejected' THEN 'Brand Rejected'
                ELSE 'Brand Status Updated'
            END,
            CASE
                WHEN NEW.status = 'approved' THEN 'Your brand "' || NEW.name || '" has been approved.'
                WHEN NEW.status = 'rejected' THEN 'Your brand "' || NEW.name || '" has been rejected.'
                ELSE 'Your brand "' || NEW.name || '" status has been updated to ' || NEW.status || '.'
            END,
            jsonb_build_object(
                'brand_id', NEW.id,
                'brand_name', NEW.name,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create brand status change trigger
CREATE TRIGGER brand_status_change_trigger
    AFTER UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION handle_brand_status_change(); 