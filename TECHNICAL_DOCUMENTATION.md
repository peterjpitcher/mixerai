# Mixer AI 2.0 - Technical Documentation

## Project Overview
Mixer AI 2.0 is a web-based content platform for streamlining the creation, optimisation, and publishing of brand-compliant content. This document outlines the technical implementation plan and decisions.

## Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS
- **AI Integration**: OpenAI API
- **Testing**: Jest and React Testing Library
- **Deployment**: Vercel
- **State Management**: React Context + Server Actions
- **Form Handling**: React Hook Form + Zod
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Implementation Status

### Completed
1. Database Schema - Core Implementation
   - ✅ Roles table with default roles and permissions
   - ✅ Profiles table linked to Supabase auth
   - ✅ Brands and brand_users tables with relationships
   - ✅ Content and versions tables with automatic versioning
   - ✅ RLS policies for all tables
   - ✅ Automatic timestamps and version tracking

### In Progress
- Helper functions and views
- Authentication system setup
- Basic UI components

### Pending
- Frontend implementation
- API routes
- Content workflow system

## Database Schema (Current State)

### Core Tables

#### 1. Roles
```sql
create table public.roles (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  permissions text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Current Role Configuration:**
| Role     | Permissions                                                          |
|----------|---------------------------------------------------------------------|
| admin    | ['all']                                                              |
| editor   | ['create_content', 'edit_content', 'delete_content', 'publish_content'] |
| reviewer | ['view_content', 'comment_content']                                   |
| writer   | ['create_content', 'edit_content']                                   |

#### 2. Profiles
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  role_id uuid references public.roles not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 3. Brands and Brand Users
```sql
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  settings jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.brand_users (
  brand_id uuid references public.brands on delete cascade,
  user_id uuid references auth.users on delete cascade,
  primary key (brand_id, user_id)
);
```

#### 4. Content and Versions
```sql
create table public.content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null,
  status text not null default 'draft',
  data jsonb not null default '{}',
  brand_id uuid references public.brands on delete cascade not null,
  created_by uuid references auth.users on delete set null,
  updated_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_status check (status in ('draft', 'in_review', 'approved', 'published', 'archived')),
  constraint valid_type check (type in ('article', 'recipe', 'pdp', 'collection', 'category'))
);

create table public.versions (
  id uuid default gen_random_uuid() primary key,
  content_id uuid references public.content on delete cascade not null,
  data jsonb not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  version_number integer not null,
  comment text,
  constraint unique_content_version unique (content_id, version_number)
);
```

### Automated Processes

#### 1. Timestamps
- All tables have `created_at` timestamps
- `updated_at` is automatically managed by trigger
```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

#### 2. Content Versioning
- Automatic version number incrementation
- Version creation on content updates
```sql
create or replace function public.track_content_changes()
returns trigger as $$
begin
  if (tg_op = 'UPDATE') then
    if old.data != new.data then
      insert into public.versions (content_id, data, created_by)
      values (new.id, new.data, auth.uid());
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
```

### RLS Policies Overview

#### Profiles
- Public SELECT access
- INSERT/UPDATE limited to own profile

#### Brands
- SELECT limited to associated users
- All operations for admin role

#### Content
- SELECT: Users with brand access
- INSERT: Users with 'create_content' permission
- UPDATE: Users with 'edit_content' permission
- DELETE: Users with 'delete_content' permission

#### Versions
- SELECT: Users with access to parent content
- INSERT: Users with 'edit_content' permission

## Next Steps: Helper Functions and Views

We should create the following helper functions and views to simplify common operations:

1. User permissions check
2. Content status transitions
3. Brand member management
4. Content type validation
5. Aggregated content views

Would you like me to proceed with creating these helper functions and views?

## Permissions Structure

The system uses a role-based access control (RBAC) model with the following permissions:

- `all`: Full system access (admin only)
- `create_content`: Ability to create new content
- `edit_content`: Ability to modify existing content
- `delete_content`: Ability to remove content
- `publish_content`: Ability to change content status to published
- `view_content`: Ability to view content
- `comment_content`: Ability to add comments/feedback

## Database Relationships

1. **Users & Roles**
   - Each user (auth.users) has one profile
   - Each profile is assigned one role
   - Roles contain an array of permissions

2. **Users & Brands** (To be implemented)
   - Many-to-many relationship through brand_users
   - Users can be associated with multiple brands
   - Brands can have multiple users

3. **Content & Brands** (To be implemented)
   - Content belongs to one brand
   - Brands can have multiple content items
   - Content versions track changes over time

## Next Implementation Steps

1. Create the profiles table
2. Set up brands and brand_users tables
3. Implement content and versions tables
4. Configure remaining RLS policies

Would you like me to proceed with the SQL script for creating the profiles table next?

## API Routes Design

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

### Users
- GET /api/users
- POST /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id

### Brands
- GET /api/brands
- POST /api/brands
- GET /api/brands/:id
- PATCH /api/brands/:id
- DELETE /api/brands/:id

### Content
- GET /api/content
- POST /api/content
- GET /api/content/:id
- PATCH /api/content/:id
- DELETE /api/content/:id

## Security Considerations
- Implement CSRF protection
- Set up rate limiting
- Configure security headers
- Implement input validation
- Set up audit logging
- Configure CORS policies

## Performance Optimizations
- Implement caching strategy
- Use edge functions where appropriate
- Optimize images and assets
- Implement lazy loading
- Use connection pooling
- Configure CDN

## Monitoring and Logging
- Set up error tracking
- Implement performance monitoring
- Configure audit logs
- Set up uptime monitoring
- Implement analytics

## Testing Strategy
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Component tests
- Performance testing

This documentation will be updated as we progress through each sprint with more detailed information and learnings. 