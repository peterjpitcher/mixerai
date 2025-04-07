-- Function to get role description
CREATE OR REPLACE FUNCTION get_role_description(role_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role_name
    WHEN 'admin' THEN '<ul>
      <li>Manage all content across assigned brands</li>
      <li>Create and manage user roles</li>
      <li>Configure brand settings and workflows</li>
      <li>Access all platform features</li>
    </ul>'
    WHEN 'editor' THEN '<ul>
      <li>Create and edit content</li>
      <li>Review and approve content</li>
      <li>Manage content workflow</li>
    </ul>'
    ELSE '<ul>
      <li>View and review content</li>
      <li>Provide feedback and comments</li>
      <li>Track content progress</li>
    </ul>'
  END;
$$;

-- Function to create invitation and send email
CREATE OR REPLACE FUNCTION create_invitation(
  p_email TEXT,
  p_role_name TEXT,
  p_brand_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_names TEXT[];
  v_user_exists BOOLEAN;
  v_invitation_id UUID;
  v_brand_id UUID;
  v_role_description TEXT;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO v_user_exists;

  -- Get brand names
  SELECT array_agg(name) INTO v_brand_names
  FROM brands
  WHERE id = ANY(p_brand_ids);

  -- Get role description
  SELECT get_role_description(p_role_name) INTO v_role_description;

  -- Create invitations for each brand
  FOREACH v_brand_id IN ARRAY p_brand_ids
  LOOP
    INSERT INTO invitations (
      id,
      brand_id,
      email,
      role_name,
      created_by
    )
    VALUES (
      gen_random_uuid(),
      v_brand_id,
      p_email,
      p_role_name,
      auth.uid()
    )
    RETURNING id INTO v_invitation_id;
  END LOOP;

  -- If user doesn't exist, send invitation email
  IF NOT v_user_exists THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/auth/v1/invite',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'email', p_email,
        'data', jsonb_build_object(
          'role', p_role_name,
          'brands', array_to_string(v_brand_names, ', '),
          'roleDescription', v_role_description
        )
      )::text
    );
  END IF;

  RETURN v_invitation_id;
END;
$$;

-- Function to get existing users for role selection
CREATE OR REPLACE FUNCTION get_users_for_role_selection()
RETURNS TABLE (
  email TEXT,
  user_id UUID,
  current_roles TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.email,
    u.id as user_id,
    array_agg(DISTINCT ur.role_name) as current_roles
  FROM auth.users u
  LEFT JOIN user_roles ur ON ur.user_id = u.id
  GROUP BY u.email, u.id
  ORDER BY u.email;
$$; 