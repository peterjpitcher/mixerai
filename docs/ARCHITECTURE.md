# MixerAI Architecture

## Overview
MixerAI is a Next.js application that uses Supabase for authentication, database, and serverless functions. The application follows a role-based access control (RBAC) system with brand-specific permissions.

## Authentication & Authorization

### Authentication Flow
1. Users can sign in using email/password or magic link
2. Authentication state is managed by the `SupabaseProvider` component
3. Protected routes use the `withRoleProtection` HOC

### Invitation System
The application includes a comprehensive invitation system that allows admins and brand approvers to invite new users:

1. **Invitation Creation**
   - Admins and brand approvers can create invitations
   - Each invitation includes:
     - Email address
     - Assigned role
     - Brand access permissions
   - Invitations are stored in the `invitations` table
   - Edge Function handles invitation creation and email sending

2. **Invitation Acceptance**
   - Users receive an email with a sign-up link
   - Link includes an invitation token
   - Upon sign-up/sign-in, the callback route:
     - Validates the invitation
     - Assigns the role and brand access
     - Marks the invitation as accepted

3. **Invitation Management**
   - Admins and brand approvers can:
     - View all invitations
     - Resend invitation emails
     - Revoke pending invitations
   - Invitation statuses: pending, accepted, revoked

### Role-Based Access Control
1. **Roles**
   - Admin: Full system access
   - Brand Approver: Can manage users and content for assigned brands
   - Content Editor: Can create and edit content for assigned brands
   - Viewer: Can view content for assigned brands

2. **Permissions**
   - Role-based permissions stored in the `roles` table
   - Brand-specific access stored in `user_brand_access`
   - Permission checks using database functions:
     - `has_permission`
     - `has_brand_access`

## Database Schema

### Core Tables
- `users`: Managed by Supabase Auth
- `roles`: Role definitions
- `user_roles`: User-role assignments
- `brands`: Brand information
- `user_brand_access`: User-brand access assignments
- `invitations`: User invitations

### Views
- `invitation_details`: Consolidated view of invitation information
- `user_permissions`: User's roles and permissions

### Functions
- `accept_invitation`: Handles invitation acceptance
- `has_permission`: Checks user permissions
- `has_brand_access`: Validates brand access

## Frontend Architecture

### Components
1. **Providers**
   - `SupabaseProvider`: Manages auth state and user data
   - `ThemeProvider`: Handles theming

2. **Auth Components**
   - `SignIn`: Email/password and magic link sign-in
   - `SignUp`: New user registration
   - `ResetPassword`: Password reset flow
   - `UpdatePassword`: Password update

3. **Admin Components**
   - `InvitationsPage`: Create new invitations
   - `InvitationListPage`: Manage invitations

### Protected Routes
- `/admin/*`: Admin-only routes
- `/dashboard`: Authenticated users
- `/brands/*`: Brand-specific routes

## Edge Functions

### create-invitation
- Validates user permissions
- Creates invitation record
- Sends invitation email
- Handles error cases

## Security Measures

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies enforce user and role-based access
- Invitation access limited to admins and brand approvers

### Data Validation
- Zod schemas for form validation
- Database constraints and checks
- Transaction handling for data integrity

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run Supabase locally: `supabase start`

### Deployment
1. Deploy database changes: `supabase db push`
2. Deploy Edge Functions: `./scripts/deploy-functions.sh`
3. Deploy application: `npm run deploy` 