-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can view brand logos they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload brand logos for their brands" ON storage.objects;

-- Create updated storage policies with correct column names
CREATE POLICY "Users can view brand logos they have access to"
ON storage.objects FOR SELECT
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
            AND brand_id::text = SPLIT_PART(name, '/', 1)
        )
    )
);

CREATE POLICY "Users can upload brand logos for their brands"
ON storage.objects FOR INSERT
WITH CHECK (
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
            AND access_level IN ('owner', 'admin')
            AND brand_id::text = SPLIT_PART(name, '/', 1)
        )
    )
);

CREATE POLICY "Users can update brand logos for their brands"
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
            AND access_level IN ('owner', 'admin')
            AND brand_id::text = SPLIT_PART(name, '/', 1)
        )
    )
);

CREATE POLICY "Users can delete brand logos for their brands"
ON storage.objects FOR DELETE
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
            AND access_level IN ('owner', 'admin')
            AND brand_id::text = SPLIT_PART(name, '/', 1)
        )
    )
);

-- Drop and recreate the user_permissions_view to ensure consistency
DROP VIEW IF EXISTS user_permissions_view;
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