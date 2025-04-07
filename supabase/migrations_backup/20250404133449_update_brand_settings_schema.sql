-- Update the brand settings schema to include all required fields
CREATE OR REPLACE FUNCTION ensure_brand_settings()
RETURNS trigger AS $$
BEGIN
  NEW.settings = COALESCE(NEW.settings, '{}'::jsonb) || jsonb_build_object(
    'brandIdentity', COALESCE((NEW.settings->>'brandIdentity')::text, ''),
    'toneOfVoice', COALESCE((NEW.settings->>'toneOfVoice')::text, ''),
    'guardrails', COALESCE((NEW.settings->'guardrails')::jsonb, '[]'::jsonb),
    'keywords', COALESCE((NEW.settings->'keywords')::jsonb, '[]'::jsonb),
    'styleGuide', COALESCE((NEW.settings->'styleGuide')::jsonb, jsonb_build_object(
      'communicationStyle', '',
      'languagePreferences', '',
      'formalityLevel', '',
      'writingStyle', ''
    )),
    'roles', COALESCE((NEW.settings->'roles')::jsonb, '[]'::jsonb),
    'allowedContentTypes', COALESCE(
      (NEW.settings->'allowedContentTypes')::jsonb,
      '["article", "social", "email", "landing", "blog"]'::jsonb
    ),
    'workflowStages', COALESCE(
      (NEW.settings->'workflowStages')::jsonb,
      '["draft", "review", "approved", "published"]'::jsonb
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_brand_settings_trigger ON brands;

-- Create the trigger
CREATE TRIGGER ensure_brand_settings_trigger
  BEFORE INSERT OR UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION ensure_brand_settings();

-- Update existing brands with the new settings structure
UPDATE brands
SET settings = (
  SELECT jsonb_build_object(
    'brandIdentity', COALESCE((settings->>'brandIdentity')::text, ''),
    'toneOfVoice', COALESCE((settings->>'toneOfVoice')::text, ''),
    'guardrails', COALESCE((settings->'guardrails')::jsonb, '[]'::jsonb),
    'keywords', COALESCE((settings->'keywords')::jsonb, '[]'::jsonb),
    'styleGuide', COALESCE((settings->'styleGuide')::jsonb, jsonb_build_object(
      'communicationStyle', '',
      'languagePreferences', '',
      'formalityLevel', '',
      'writingStyle', ''
    )),
    'roles', COALESCE((settings->'roles')::jsonb, '[]'::jsonb),
    'allowedContentTypes', COALESCE(
      (settings->'allowedContentTypes')::jsonb,
      '["article", "social", "email", "landing", "blog"]'::jsonb
    ),
    'workflowStages', COALESCE(
      (settings->'workflowStages')::jsonb,
      '["draft", "review", "approved", "published"]'::jsonb
    )
  )
); 