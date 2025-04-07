-- Drop existing type if it exists
do $$ begin
    if exists (select 1 from pg_type where typname = 'user_role') then
        drop type user_role cascade;
    end if;
end $$;

-- Create enum for role types
create type user_role as enum ('admin', 'brand_approver', 'content_editor', 'viewer');

-- Create roles table if it doesn't exist
create table if not exists roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    permissions text[] not null default array[]::text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create user_roles table if it doesn't exist
create table if not exists user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role_id uuid not null references roles(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, role_id)
);

-- Create brands table if it doesn't exist
create table if not exists brands (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create user_brand_access table if it doesn't exist
create table if not exists user_brand_access (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    brand_id uuid not null references brands(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, brand_id)
);

-- Add RLS policies
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table brands enable row level security;
alter table user_brand_access enable row level security;

-- Create indexes
create index if not exists roles_name_idx on roles(name);
create index if not exists user_roles_user_id_idx on user_roles(user_id);
create index if not exists user_roles_role_id_idx on user_roles(role_id);
create index if not exists brands_name_idx on brands(name);
create index if not exists user_brand_access_user_id_idx on user_brand_access(user_id);
create index if not exists user_brand_access_brand_id_idx on user_brand_access(brand_id);

-- Insert default roles if they don't exist
insert into roles (name, permissions)
values
    ('admin', array['*']),
    ('brand_approver', array['read:brands', 'update:brands', 'create:content', 'read:content', 'update:content', 'delete:content']),
    ('content_editor', array['create:content', 'read:content', 'update:content', 'delete:content']),
    ('viewer', array['read:brands', 'read:content'])
on conflict (name) do update
set permissions = excluded.permissions;

-- Create permissions table
CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    r.name as role_name,
    ARRAY_AGG(DISTINCT p.name) as permissions,
    ARRAY_AGG(DISTINCT b.name) as accessible_brand_names
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
LEFT JOIN user_brand_access uba ON u.id = uba.user_id
LEFT JOIN brands b ON uba.brand_id = b.id
GROUP BY u.id, r.name;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
    ('create:brands', 'Can create new brands'),
    ('read:brands', 'Can view brands'),
    ('update:brands', 'Can update brands'),
    ('delete:brands', 'Can delete brands'),
    ('manage:users', 'Can manage users'),
    ('create:content', 'Can create content'),
    ('read:content', 'Can view content'),
    ('update:content', 'Can update content'),
    ('delete:content', 'Can delete content'),
    ('manage:roles', 'Can manage roles and permissions');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'brand_approver'
AND p.name IN ('read:brands', 'update:brands', 'create:content', 'read:content', 'update:content', 'delete:content');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'content_editor'
AND p.name IN ('create:content', 'read:content', 'update:content', 'delete:content');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.name IN ('read:brands', 'read:content'); 