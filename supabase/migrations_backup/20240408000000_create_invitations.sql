-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(brand_id, email, role_name, status)
);

-- Create RLS policies for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own invitations
CREATE POLICY "Users can view their own invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (
    email = auth.jwt() ->> 'email'
);

-- Allow users with admin role to create invitations
CREATE POLICY "Admins can create invitations"
ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'admin'
    )
);

-- Create function to handle invitations
CREATE OR REPLACE FUNCTION public.handle_invitation(
    invitation_id UUID,
    accept_invitation BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation invitations;
    v_user_id UUID;
BEGIN
    -- Get the current user's ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = auth.jwt() ->> 'email';

    -- Get and validate the invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE id = invitation_id
    AND email = auth.jwt() ->> 'email'
    AND status = 'pending'
    AND expires_at > now();

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;

    -- Update invitation status
    UPDATE invitations
    SET status = CASE WHEN accept_invitation THEN 'accepted' ELSE 'declined' END
    WHERE id = invitation_id;

    -- If accepting, create user role
    IF accept_invitation THEN
        INSERT INTO user_roles (user_id, role_name, permissions, accessible_brand_names)
        VALUES (
            v_user_id,
            v_invitation.role_name,
            CASE 
                WHEN v_invitation.role_name = 'admin' THEN '{*}'
                WHEN v_invitation.role_name = 'editor' THEN '{read,write}'
                ELSE '{read}'
            END,
            ARRAY[v_invitation.brand_id::text]
        )
        ON CONFLICT (user_id, role_name) 
        DO UPDATE SET
            accessible_brand_names = array_append(
                user_roles.accessible_brand_names,
                v_invitation.brand_id::text
            );
    END IF;
END;
$$; 