-- Drop views first
DROP VIEW IF EXISTS user_permissions_view CASCADE;
DROP VIEW IF EXISTS user_roles CASCADE;

-- Create brands table if it doesn't exist
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_roles_table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles_table (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    accessible_brand_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_name)
);

-- Create user_brand_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_brand_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, brand_id)
);

-- Enable RLS on tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name)
VALUES ('brand-logos', 'brand-logos')
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand logos
CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'brand-logos' );

CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'brand-logos'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Brand owners can update their logos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'brand-logos'
    AND (
        EXISTS (
            SELECT 1 FROM user_roles_table
            WHERE user_id = auth.uid()
            AND role_name = 'super_admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM user_brand_access
            WHERE user_id = auth.uid()
            AND access_level = 'owner'
            AND brand_id = (SELECT id FROM brands WHERE name = SPLIT_PART(name, '/', 2))
        )
    )
);

-- Create or update tables
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  accessible_brand_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create or replace function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'super_admin'
    )
  );

-- Create policies for brands
CREATE POLICY "Users can view accessible brands"
  ON brands
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND (
        role_name = 'super_admin'
        OR name = ANY(accessible_brand_names)
      )
    )
  );

CREATE POLICY "Super admins can manage all brands"
  ON brands
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'super_admin'
    )
  );

-- Create view for user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  ur.user_id,
  ur.role_name,
  ur.permissions,
  ur.accessible_brand_names,
  b.id as brand_id,
  b.name as brand_name
FROM user_roles ur
LEFT JOIN brands b ON b.name = ANY(ur.accessible_brand_names)
WHERE ur.user_id = auth.uid();

-- Grant permissions on the view
GRANT SELECT ON user_permissions_view TO authenticated;

-- Insert super admin role for the current user if not exists
INSERT INTO user_roles (user_id, role_name, permissions)
SELECT auth.uid(), 'super_admin', '["*"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role_name = 'super_admin'
); 