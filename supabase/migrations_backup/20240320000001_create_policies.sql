-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brand_access ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_permissions_view
    WHERE user_id = auth.uid()
    AND permissions @> ARRAY[permission_name]
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to a brand
CREATE OR REPLACE FUNCTION has_brand_access(brand_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_brand_access
    WHERE user_id = auth.uid()
    AND brand_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
do $$ begin
    -- Drop roles policies
    if exists (select 1 from pg_policy where polrelid = 'roles'::regclass) then
        drop policy if exists "Admins can manage roles" on roles;
        drop policy if exists "Users can view roles" on roles;
    end if;

    -- Drop user_roles policies
    if exists (select 1 from pg_policy where polrelid = 'user_roles'::regclass) then
        drop policy if exists "Admins can manage user roles" on user_roles;
        drop policy if exists "Users can view their own roles" on user_roles;
    end if;

    -- Drop brands policies
    if exists (select 1 from pg_policy where polrelid = 'brands'::regclass) then
        drop policy if exists "Admins can manage brands" on brands;
        drop policy if exists "Users can view accessible brands" on brands;
    end if;

    -- Drop user_brand_access policies
    if exists (select 1 from pg_policy where polrelid = 'user_brand_access'::regclass) then
        drop policy if exists "Admins can manage brand access" on user_brand_access;
        drop policy if exists "Users can view their own brand access" on user_brand_access;
    end if;
end $$;

-- Create roles policies
create policy "Admins can manage roles"
    on roles
    for all
    using (
        exists (
            select 1 from user_roles ur
            join roles r on r.id = ur.role_id
            where ur.user_id = auth.uid()
            and r.name = 'admin'
        )
    );

create policy "Users can view roles"
    on roles
    for select
    using (true);

-- Create user_roles policies
create policy "Admins can manage user roles"
    on user_roles
    for all
    using (
        exists (
            select 1 from user_roles ur
            join roles r on r.id = ur.role_id
            where ur.user_id = auth.uid()
            and r.name = 'admin'
        )
    );

create policy "Users can view their own roles"
    on user_roles
    for select
    using (user_id = auth.uid());

-- Create brands policies
create policy "Admins can manage brands"
    on brands
    for all
    using (
        exists (
            select 1 from user_roles ur
            join roles r on r.id = ur.role_id
            where ur.user_id = auth.uid()
            and r.name = 'admin'
        )
    );

create policy "Users can view accessible brands"
    on brands
    for select
    using (
        exists (
            select 1 from user_brand_access uba
            where uba.user_id = auth.uid()
            and uba.brand_id = brands.id
        )
    );

-- Create user_brand_access policies
create policy "Admins can manage brand access"
    on user_brand_access
    for all
    using (
        exists (
            select 1 from user_roles ur
            join roles r on r.id = ur.role_id
            where ur.user_id = auth.uid()
            and r.name = 'admin'
        )
    );

create policy "Users can view their own brand access"
    on user_brand_access
    for select
    using (user_id = auth.uid());

-- Permissions policies
CREATE POLICY "Permissions viewable by all authenticated users"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permissions manageable by users with manage:roles permission"
  ON permissions FOR ALL
  TO authenticated
  USING (has_permission('manage:roles'))
  WITH CHECK (has_permission('manage:roles'));

-- Role permissions policies
CREATE POLICY "Role permissions viewable by all authenticated users"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Role permissions manageable by users with manage:roles permission"
  ON role_permissions FOR ALL
  TO authenticated
  USING (has_permission('manage:roles'))
  WITH CHECK (has_permission('manage:roles'));

-- User roles policies
CREATE POLICY "User roles manageable by users with manage:users permission"
  ON user_roles FOR ALL
  TO authenticated
  USING (has_permission('manage:users'))
  WITH CHECK (has_permission('manage:users'));

-- Brands policies
CREATE POLICY "Brands updatable by users with update:brands permission"
  ON brands FOR UPDATE
  TO authenticated
  USING (has_permission('update:brands'))
  WITH CHECK (has_permission('update:brands'));

CREATE POLICY "Brands deletable by users with delete:brands permission"
  ON brands FOR DELETE
  TO authenticated
  USING (has_permission('delete:brands'));

-- User brand access policies
CREATE POLICY "Brand access manageable by users with manage:users permission"
  ON user_brand_access FOR ALL
  TO authenticated
  USING (has_permission('manage:users'))
  WITH CHECK (has_permission('manage:users')); 