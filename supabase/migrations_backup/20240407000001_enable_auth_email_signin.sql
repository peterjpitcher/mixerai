-- Create an admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
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
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f7f7da3c-89f2-4802-a91c-8c634c81a56a',
  'authenticated',
  'authenticated',
  'peter.pitcher@genmills.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create identity for the admin user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'f7f7da3c-89f2-4802-a91c-8c634c81a56a',
  'f7f7da3c-89f2-4802-a91c-8c634c81a56a',
  jsonb_build_object(
    'sub', 'f7f7da3c-89f2-4802-a91c-8c634c81a56a',
    'email', 'peter.pitcher@genmills.com'
  ),
  'email',
  'peter.pitcher@genmills.com',
  now(),
  now(),
  now()
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}'
);

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  accessible_brand_names TEXT[] NOT NULL DEFAULT '{}'
);

-- Insert default roles
INSERT INTO public.roles (name, permissions)
VALUES 
  ('admin', '{*}'),
  ('editor', '{read,write}'),
  ('viewer', '{read}')
ON CONFLICT (name) DO NOTHING;

-- Assign admin role to the admin user
INSERT INTO public.user_roles (user_id, role_name, permissions, accessible_brand_names)
VALUES (
  'f7f7da3c-89f2-4802-a91c-8c634c81a56a',
  'admin',
  '{*}',
  '{*}'
)
ON CONFLICT DO NOTHING; 