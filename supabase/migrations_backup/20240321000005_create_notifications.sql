-- Create notification type enum
create type notification_type as enum ('invitation_accepted', 'invitation_revoked', 'user_joined');

-- Create notifications table
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type notification_type not null,
    title text not null,
    message text not null,
    data jsonb not null default '{}'::jsonb,
    read boolean not null default false,
    created_at timestamptz not null default now()
);

-- Add RLS policies
alter table notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
    on notifications
    for select
    using (user_id = auth.uid());

-- Create indexes
create index notifications_user_id_idx on notifications(user_id);
create index notifications_created_at_idx on notifications(created_at desc);
create index notifications_read_idx on notifications(read);

-- Create function to handle invitation notifications
create or replace function handle_invitation_notification()
returns trigger as $$
begin
    if TG_OP = 'UPDATE' then
        -- When invitation is accepted
        if NEW.status = 'accepted' and OLD.status = 'pending' then
            -- Notify the person who sent the invitation
            insert into notifications (user_id, type, title, message, data)
            values (
                NEW.invited_by,
                'invitation_accepted',
                'Invitation Accepted',
                format('The invitation for %s has been accepted', NEW.email),
                jsonb_build_object(
                    'invitation_id', NEW.id,
                    'email', NEW.email,
                    'accepted_at', NEW.accepted_at
                )
            );
        -- When invitation is revoked
        elsif NEW.status = 'revoked' and OLD.status = 'pending' then
            -- Notify the person who sent the invitation
            insert into notifications (user_id, type, title, message, data)
            values (
                NEW.invited_by,
                'invitation_revoked',
                'Invitation Revoked',
                format('The invitation for %s has been revoked', NEW.email),
                jsonb_build_object(
                    'invitation_id', NEW.id,
                    'email', NEW.email
                )
            );
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for invitation notifications
create trigger invitation_notification_trigger
    after update on invitations
    for each row
    execute function handle_invitation_notification(); 