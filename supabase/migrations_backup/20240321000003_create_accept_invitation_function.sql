-- Create a function to handle invitation acceptance
create or replace function accept_invitation(
  p_user_id uuid,
  p_invitation_id uuid,
  p_role_id uuid,
  p_brand_ids uuid[]
) returns void as $$
begin
  -- Check if invitation exists and is pending
  if not exists (
    select 1 from invitations
    where id = p_invitation_id
    and status = 'pending'
  ) then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Begin transaction
  begin
    -- Insert user role
    insert into user_roles (user_id, role_id)
    values (p_user_id, p_role_id);

    -- Insert brand access for each brand
    insert into user_brand_access (user_id, brand_id)
    select p_user_id, unnest(p_brand_ids);

    -- Update invitation status
    update invitations
    set status = 'accepted',
        accepted_at = now()
    where id = p_invitation_id;

    -- Commit transaction
    commit;
  exception
    when others then
      -- Rollback transaction on error
      rollback;
      raise;
  end;
end;
$$ language plpgsql security definer; 