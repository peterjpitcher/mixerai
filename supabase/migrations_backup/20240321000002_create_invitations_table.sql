-- Create invitation status enum
create type invitation_status as enum ('pending', 'accepted', 'revoked');

-- Create invitations table
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role_id uuid not null references roles(id),
  brand_ids uuid[] not null,
  invited_by uuid not null references auth.users(id),
  status invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint valid_brand_ids check (array_length(brand_ids, 1) > 0)
);

-- Add RLS policies
alter table invitations enable row level security;

-- Allow admins and brand approvers to view all invitations
create policy "Admins and brand approvers can view all invitations"
  on invitations for select
  using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name in ('admin', 'brand_approver')
    )
  );

-- Allow admins and brand approvers to create invitations
create policy "Admins and brand approvers can create invitations"
  on invitations for insert
  with check (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name in ('admin', 'brand_approver')
    )
  );

-- Allow admins and brand approvers to update invitations
create policy "Admins and brand approvers can update invitations"
  on invitations for update
  using (
    exists (
      select 1 from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name in ('admin', 'brand_approver')
    )
  );

-- Create index for faster lookups
create index invitations_email_idx on invitations(email);
create index invitations_status_idx on invitations(status);
create index invitations_created_at_idx on invitations(created_at desc);

-- Add trigger for updating updated_at
create trigger update_invitations_updated_at
  before update on invitations
  for each row
  execute function update_updated_at_column(); 