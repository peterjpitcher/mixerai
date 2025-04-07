-- Create tables
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT DEFAULT 'https://placehold.co/200x200?text=Brand+Logo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS brand_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, role_name)
);

CREATE TABLE IF NOT EXISTS content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
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
    feedback TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    email TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id),
    role TEXT DEFAULT 'member',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(email, brand_id)
);

CREATE TABLE IF NOT EXISTS user_brand_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, brand_id)
);

CREATE TABLE IF NOT EXISTS user_roles_table (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    accessible_brand_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
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

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_roles_updated_at
    BEFORE UPDATE ON brand_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_roles_brand_id ON brand_roles(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_roles_role_name ON brand_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_brand_id ON user_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_user_id ON user_brand_access(user_id);

-- Create views
CREATE VIEW user_roles AS
SELECT 
    ur.user_id,
    ur.role_name,
    ur.permissions::jsonb,
    ur.accessible_brand_names::text[],
    ur.created_at,
    ur.updated_at
FROM user_roles_table ur;

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
    ('SEO Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Editor', ARRAY['edit_content', 'approve_content', 'reject_content']),
    ('Culinary Specialist', ARRAY['create_content', 'edit_own_content']),
    ('Legal Specialist', ARRAY['review_content', 'approve_content']),
    ('Brand Member', ARRAY['view_content']),
    ('Publisher', ARRAY['publish_content']),
    ('Project Manager', ARRAY['manage_content', 'assign_tasks']);

-- Create admin user and grant access
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'peter.pitcher@genmills.com',
    crypt('Pitcher1458955', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Peter Pitcher"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE
SET encrypted_password = crypt('Pitcher1458955', gen_salt('bf'));

-- Create admin profile
INSERT INTO profiles (id, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Peter Pitcher',
    'admin'
) ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Function to check Resend API key
CREATE OR REPLACE FUNCTION check_resend_api_key()
RETURNS TEXT AS $$
DECLARE
    v_api_key TEXT;
BEGIN
    BEGIN
        v_api_key := current_setting('app.resend_api_key', true);
        IF v_api_key IS NULL THEN
            RETURN 'API key is not set';
        END IF;
        RETURN format('API key is set: %s...%s', 
            left(v_api_key, 5), 
            right(v_api_key, 5)
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN 'API key is not set';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up Resend API key
DO $$
BEGIN
    -- Set the Resend API key for development
    PERFORM set_config('app.resend_api_key', 're_enrrAdjA_9pC2TsvxXzrvTU9HB4VnhoF7', true);
    
    -- Verify the key was set
    IF current_setting('app.resend_api_key', true) IS NULL THEN
        RAISE EXCEPTION 'Failed to set Resend API key';
    END IF;
    
    -- Log the key status
    RAISE NOTICE 'Resend API key status: %', check_resend_api_key();
END $$;

-- Create function to handle brand role creation
CREATE OR REPLACE FUNCTION handle_brand_role_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_name TEXT;
BEGIN
    -- If email is provided, log invitation
    IF NEW.email IS NOT NULL THEN
        -- Get brand name
        SELECT name INTO v_brand_name
        FROM brands
        WHERE id = NEW.brand_id;
        
        -- Log invitation details
        RAISE NOTICE E'\n\nNew role invitation:\nTo: %\nBrand: %\nRole: %\nMessage: Please contact peter.pitcher@genmills.com to accept this invitation\n', 
            NEW.email, v_brand_name, NEW.role_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for brand role creation
CREATE TRIGGER on_brand_role_created
    AFTER INSERT ON brand_roles
    FOR EACH ROW
    EXECUTE FUNCTION handle_brand_role_creation();

-- Enable email sign in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ language plpgsql security definer;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant access to authenticated users
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_brand_access TO authenticated;

-- Disable RLS for development
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE content DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_roles DISABLE ROW LEVEL SECURITY; 