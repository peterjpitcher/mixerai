-- Drop the existing check constraint
ALTER TABLE content DROP CONSTRAINT IF EXISTS valid_type;

-- Add the new check constraint with updated content types
ALTER TABLE content ADD CONSTRAINT valid_type CHECK (
  content_type = ANY (ARRAY[
    'article',
    'social',
    'email',
    'product'
  ]::text[])
); 