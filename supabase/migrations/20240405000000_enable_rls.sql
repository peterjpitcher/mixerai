-- Enable RLS for all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for brands table
CREATE POLICY "Users can view brands they have access to"
ON brands FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = brands.id
    AND user_brand_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create brands"
ON brands FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update brands they have access to"
ON brands FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = brands.id
    AND user_brand_access.user_id = auth.uid()
    AND user_brand_access.role IN ('owner', 'admin')
  )
);

-- Create policies for content table
CREATE POLICY "Users can view content for brands they have access to"
ON content FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = content.brand_id
    AND user_brand_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create content for brands they have access to"
ON content FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = content.brand_id
    AND user_brand_access.user_id = auth.uid()
    AND user_brand_access.role IN ('owner', 'admin', 'editor')
  )
);

-- Create policies for profiles table
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Create policies for invitations table
CREATE POLICY "Users can view invitations for their brands"
ON invitations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = invitations.brand_id
    AND user_brand_access.user_id = auth.uid()
    AND user_brand_access.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can create invitations for their brands"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = invitations.brand_id
    AND user_brand_access.user_id = auth.uid()
    AND user_brand_access.role IN ('owner', 'admin')
  )
);

-- Create policies for roles table
CREATE POLICY "Users can view all roles"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Create policies for brand_roles table
CREATE POLICY "Users can view brand roles they have access to"
ON brand_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = brand_roles.brand_id
    AND user_brand_access.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage brand roles if they are owners"
ON brand_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_brand_access
    WHERE user_brand_access.brand_id = brand_roles.brand_id
    AND user_brand_access.user_id = auth.uid()
    AND user_brand_access.role = 'owner'
  )
);

-- Create storage policies
CREATE POLICY "Users can view brand logos they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'brand-logos' AND (
    EXISTS (
      SELECT 1 FROM user_brand_access
      WHERE user_brand_access.brand_id::text = (storage.foldername(name))[1]
      AND user_brand_access.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload brand logos for their brands"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-logos' AND (
    EXISTS (
      SELECT 1 FROM user_brand_access
      WHERE user_brand_access.brand_id::text = (storage.foldername(name))[1]
      AND user_brand_access.user_id = auth.uid()
      AND user_brand_access.role IN ('owner', 'admin')
    )
  )
);

-- Create user_permissions_view
DROP VIEW IF EXISTS user_permissions_view;
CREATE VIEW user_permissions_view AS
SELECT 
    uba.user_id,
    uba.brand_id,
    uba.role,
    b.name as brand_name,
    p.full_name as user_name,
    p.avatar_url as user_avatar
FROM user_brand_access uba
JOIN brands b ON b.id = uba.brand_id
JOIN profiles p ON p.id = uba.user_id;

-- Grant access to the view
GRANT SELECT ON user_permissions_view TO authenticated; 