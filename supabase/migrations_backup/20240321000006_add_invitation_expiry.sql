-- Add expiry_date column to invitations table
ALTER TABLE invitations
ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;

-- Update existing invitations to have an expiry date of 7 days from creation
UPDATE invitations
SET expiry_date = created_at + INTERVAL '7 days'
WHERE expiry_date IS NULL;

-- Make expiry_date required for future invitations
ALTER TABLE invitations
ALTER COLUMN expiry_date SET NOT NULL,
ALTER COLUMN expiry_date SET DEFAULT NOW() + INTERVAL '7 days';

-- Update the accept_invitation function to check for expiry
CREATE OR REPLACE FUNCTION accept_invitation(p_invitation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if invitation exists, is pending, and not expired
  IF NOT EXISTS (
    SELECT 1 FROM invitations
    WHERE id = p_invitation_id
    AND status = 'pending'
    AND expiry_date > NOW()
  ) THEN
    -- Check if it's expired specifically
    IF EXISTS (
      SELECT 1 FROM invitations
      WHERE id = p_invitation_id
      AND status = 'pending'
      AND expiry_date <= NOW()
    ) THEN
      -- Update status to expired
      UPDATE invitations
      SET status = 'expired'
      WHERE id = p_invitation_id;
      
      RAISE EXCEPTION 'Invitation has expired';
    ELSE
      RAISE EXCEPTION 'Invalid or already used invitation';
    END IF;
  END IF;

  -- Rest of the function remains the same
  BEGIN
    -- Get invitation details
    WITH invitation_data AS (
      SELECT role_id, brand_ids
      FROM invitations
      WHERE id = p_invitation_id
    )
    -- Create user role
    INSERT INTO user_roles (user_id, role_id)
    SELECT p_user_id, role_id
    FROM invitation_data;

    -- Create brand access for each brand
    INSERT INTO user_brand_access (user_id, brand_id)
    SELECT p_user_id, unnest(brand_ids)::uuid
    FROM invitation_data;

    -- Update invitation status
    UPDATE invitations
    SET 
      status = 'accepted',
      accepted_at = NOW()
    WHERE id = p_invitation_id;

    -- Create notification for the inviter
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    )
    SELECT 
      invited_by,
      'invitation_accepted',
      'Invitation Accepted',
      email || ' has accepted your invitation',
      jsonb_build_object(
        'invitation_id', id,
        'email', email,
        'role_name', (SELECT name FROM roles WHERE id = role_id)
      )
    FROM invitations
    WHERE id = p_invitation_id;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;

-- Create a function to automatically expire invitations
CREATE OR REPLACE FUNCTION expire_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expiry_date <= NOW();
END;
$$;

-- Create a trigger to run expire_invitations every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-invitations',
  '0 * * * *', -- Every hour
  'SELECT expire_invitations()'
); 