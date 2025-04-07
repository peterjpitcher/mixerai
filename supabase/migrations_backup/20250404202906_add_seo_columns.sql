-- Add SEO-related columns to content table
ALTER TABLE content
ADD COLUMN IF NOT EXISTS seo_title text,
ADD COLUMN IF NOT EXISTS seo_description text,
ADD COLUMN IF NOT EXISTS seo_slug text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_seo_title ON content(seo_title);
CREATE INDEX IF NOT EXISTS idx_content_seo_slug ON content(seo_slug);

-- Add comments
COMMENT ON COLUMN content.seo_title IS 'SEO-optimized title for the content';
COMMENT ON COLUMN content.seo_description IS 'SEO-optimized meta description';
COMMENT ON COLUMN content.seo_slug IS 'SEO-friendly URL slug'; 