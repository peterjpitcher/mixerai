-- Add approval_stages column to brands table
ALTER TABLE brands ADD COLUMN approval_stages text[] DEFAULT ARRAY['draft', 'review', 'approved']::text[];

-- Update existing brands with default approval stages
UPDATE brands SET approval_stages = ARRAY['draft', 'review', 'approved']::text[] WHERE approval_stages IS NULL;
