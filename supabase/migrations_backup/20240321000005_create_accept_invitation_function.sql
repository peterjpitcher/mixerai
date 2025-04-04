-- Create a function to accept invitations
CREATE OR REPLACE FUNCTION accept_invitation(p_invitation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if invitation exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM invitations
    WHERE id = p_invitation_id
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Start transaction
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
      -- Rollback transaction on error
      RAISE;
  END;
END;
$$; 