-- Create a view for invitation management
create or replace view invitation_details as
select 
  i.id,
  i.email,
  i.status,
  i.created_at,
  i.accepted_at,
  r.name as role_name,
  array_agg(b.name) as brand_names,
  u.email as invited_by_email
from invitations i
left join roles r on i.role_id = r.id
left join unnest(i.brand_ids) as brand_id on true
left join brands b on b.id = brand_id::uuid
left join auth.users u on i.invited_by = u.id
group by i.id, i.email, i.status, i.created_at, i.accepted_at, r.name, u.email;

-- Create a view for invitations that includes role and inviter information
CREATE VIEW invitations_view AS
SELECT 
    i.id,
    i.email,
    i.role_id,
    i.brand_ids,
    i.invited_by,
    i.status,
    i.created_at,
    i.accepted_at,
    i.expiry_date,
    r.name as role_name,
    p.email as invited_by_email
FROM invitations i
LEFT JOIN roles r ON i.role_id = r.id
LEFT JOIN profiles p ON i.invited_by = p.id;

-- Create policy to allow admins and brand approvers to view all invitations
CREATE POLICY "Allow admins and brand approvers to view invitations" ON invitations_view
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role_id IN (
                SELECT id FROM roles WHERE name IN ('admin', 'brand_approver')
            )
        )
    ); 