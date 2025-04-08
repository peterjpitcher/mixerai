-- Create storage bucket for brand logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies for brand-logos bucket
DROP POLICY IF EXISTS "Anyone can view brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Brand owners can update their logos" ON storage.objects;

-- Create storage policies
CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'brand-logos'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their brand logos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'brand-logos'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their brand logos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'brand-logos'
    AND auth.role() = 'authenticated'
);

-- Set up bucket configuration
UPDATE storage.buckets
SET public = true,
    file_size_limit = 2097152, -- 2MB
    allowed_mime_types = ARRAY['image/png', 'image/svg+xml']::text[]
WHERE id = 'brand-logos'; 