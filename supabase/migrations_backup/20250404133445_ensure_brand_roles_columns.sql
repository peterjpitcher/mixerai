-- Drop the existing brand_roles table and recreate it with all required columns
DROP TABLE IF EXISTS brand_roles;

CREATE TABLE brand_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
    role_name text REFERENCES roles(name) ON DELETE CASCADE,
    email text,
    display_name text,
    is_compulsory boolean DEFAULT false,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(brand_id, role_name)
);

-- Create indexes for better performance
CREATE INDEX idx_brand_roles_brand_id ON brand_roles(brand_id);
CREATE INDEX idx_brand_roles_role_name ON brand_roles(role_name);
CREATE INDEX idx_brand_roles_order ON brand_roles("order");

-- Disable RLS on brand_roles table
ALTER TABLE brand_roles DISABLE ROW LEVEL SECURITY; 