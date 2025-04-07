-- Add approval_stages column to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS approval_stages TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing content with default approval stages
UPDATE content SET approval_stages = ARRAY['draft', 'review', 'approved', 'published']::TEXT[] WHERE approval_stages IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_content_approval_stages ON content USING GIN (approval_stages);

-- Add comment
COMMENT ON COLUMN content.approval_stages IS 'Array of approval stages for the content workflow'; 