-- Add missing columns to content table
ALTER TABLE content
ADD COLUMN IF NOT EXISTS content_format text DEFAULT 'markdown',
ADD COLUMN IF NOT EXISTS article_type text,
ADD COLUMN IF NOT EXISTS optimization_url text,
ADD COLUMN IF NOT EXISTS optimization_feedback text,
ADD COLUMN IF NOT EXISTS cycle_type text,
ADD COLUMN IF NOT EXISTS cycle_id text,
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS format text DEFAULT 'article';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_article_type ON content(article_type);
CREATE INDEX IF NOT EXISTS idx_content_content_format ON content(content_format);
CREATE INDEX IF NOT EXISTS idx_content_cycle_type ON content(cycle_type);

-- Add comment to explain the content_format column
COMMENT ON COLUMN content.content_format IS 'Format of the content (markdown, html, etc.)';
COMMENT ON COLUMN content.article_type IS 'Type of article (how-to, lifestyle, etc.)';
COMMENT ON COLUMN content.cycle_type IS 'Type of content cycle (new, optimization)';
COMMENT ON COLUMN content.target_audience IS 'Target audience for the content';
COMMENT ON COLUMN content.tone IS 'Tone of the content (professional, conversational, etc.)';
COMMENT ON COLUMN content.format IS 'Format of the content (article, product, recipe, etc.)';
