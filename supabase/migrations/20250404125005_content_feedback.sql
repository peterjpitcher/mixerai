-- Create content_feedback table
create table "public"."content_feedback" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "content" text not null,
    "feedback" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "is_addressed" boolean not null default false,
    "addressed_at" timestamp with time zone,
    "addressed_by" uuid references auth.users(id),
    constraint "content_feedback_pkey" primary key ("id")
);

-- Enable RLS
alter table "public"."content_feedback" enable row level security;

-- Create development policy that allows all operations
create policy "Allow all operations during development"
    on "public"."content_feedback"
    for all
    using (true)
    with check (true);

-- Add indexes
create index "content_feedback_created_at_idx" on "public"."content_feedback" ("created_at");
create index "content_feedback_is_addressed_idx" on "public"."content_feedback" ("is_addressed");

-- Add comment
comment on table "public"."content_feedback" is 'Stores feedback on generated content for future improvements';
