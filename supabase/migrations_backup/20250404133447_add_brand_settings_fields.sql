-- Add new settings fields to brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS brand_identity TEXT,
ADD COLUMN IF NOT EXISTS tone_of_voice TEXT,
ADD COLUMN IF NOT EXISTS guardrails TEXT[];

-- Update settings JSONB type to include new fields if they don't exist
UPDATE brands 
SET settings = settings || 
  jsonb_build_object(
    'brandIdentity', COALESCE(brand_identity, ''),
    'toneOfVoice', COALESCE(tone_of_voice, ''),
    'guardrails', COALESCE(guardrails, ARRAY[]::TEXT[])
  )
WHERE NOT (settings ? 'brandIdentity' AND settings ? 'toneOfVoice' AND settings ? 'guardrails');

-- Create an index for faster searches
CREATE INDEX IF NOT EXISTS idx_brands_settings ON brands USING gin (settings); 