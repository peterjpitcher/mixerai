-- Add new settings fields to brands table
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT jsonb_build_object(
  'brandIdentity', '',
  'toneOfVoice', '',
  'guardrails', ARRAY[]::text[],
  'allowedContentTypes', ARRAY['article', 'product', 'recipe', 'email', 'social']::text[]
);

-- Create an index for faster searches
CREATE INDEX IF NOT EXISTS idx_brands_settings ON brands USING gin (settings);

-- Add a trigger to ensure settings has all required fields
CREATE OR REPLACE FUNCTION ensure_brand_settings()
RETURNS trigger AS $$
BEGIN
  NEW.settings = COALESCE(NEW.settings, '{}'::jsonb) || jsonb_build_object(
    'brandIdentity', COALESCE((NEW.settings->>'brandIdentity')::text, ''),
    'toneOfVoice', COALESCE((NEW.settings->>'toneOfVoice')::text, ''),
    'guardrails', COALESCE((NEW.settings->'guardrails')::jsonb, '[]'::jsonb),
    'allowedContentTypes', COALESCE(
      (NEW.settings->'allowedContentTypes')::jsonb,
      '["article", "product", "recipe", "email", "social"]'::jsonb
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_brand_settings_trigger
  BEFORE INSERT OR UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION ensure_brand_settings(); 