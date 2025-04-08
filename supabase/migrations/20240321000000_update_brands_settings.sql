-- Drop the existing settings column if it exists (to ensure clean state)
ALTER TABLE IF EXISTS brands DROP COLUMN IF EXISTS settings;

-- Add the settings column with proper type definition and comment
ALTER TABLE brands ADD COLUMN settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN brands.settings IS 'JSON object containing brand settings including brandIdentity, toneOfVoice, guardrails, etc.';

-- Add type checking constraint
ALTER TABLE brands ADD CONSTRAINT brands_settings_check CHECK (
    jsonb_typeof(settings) = 'object' AND
    (settings ? 'brandIdentity' OR settings->>'brandIdentity' IS NULL) AND
    (settings ? 'toneOfVoice' OR settings->>'toneOfVoice' IS NULL) AND
    (settings ? 'guardrails' OR settings->'guardrails' IS NULL) AND
    (settings ? 'workflowStages' OR settings->'workflowStages' IS NULL) AND
    (settings ? 'customAgencies' OR settings->'customAgencies' IS NULL) AND
    (settings ? 'keywords' OR settings->'keywords' IS NULL) AND
    (settings ? 'styleGuide' OR settings->'styleGuide' IS NULL) AND
    (settings ? 'roles' OR settings->'roles' IS NULL) AND
    (settings ? 'allowedContentTypes' OR settings->'allowedContentTypes' IS NULL)
); 