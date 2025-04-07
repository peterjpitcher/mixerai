

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'brand_approver',
    'content_editor',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_user_id" "uuid", "p_invitation_id" "uuid", "p_role_id" "uuid", "p_brand_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_invitation"("p_user_id" "uuid", "p_invitation_id" "uuid", "p_role_id" "uuid", "p_brand_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_user_to_brand"("admin_user_id" "uuid", "target_user_id" "uuid", "target_brand_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Check if admin user has permission
  if not has_permission(admin_user_id, 'all') then
    raise exception 'Insufficient permissions';
  end if;

  -- Add user to brand
  insert into public.brand_users (user_id, brand_id)
  values (target_user_id, target_brand_id)
  on conflict do nothing;
end;
$$;


ALTER FUNCTION "public"."add_user_to_brand"("admin_user_id" "uuid", "target_user_id" "uuid", "target_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_transition_content_status"("user_id" "uuid", "content_id" "uuid", "new_status" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_status text;
  valid_transition boolean;
begin
  -- Get current status
  select status into current_status
  from public.content
  where id = content_id;

  -- Define valid transitions based on permissions
  valid_transition := case
    -- Anyone with edit_content can move to in_review
    when new_status = 'in_review' and has_permission(user_id, 'edit_content') then true
    -- Reviewers can approve or reject (back to draft)
    when (new_status = 'approved' or new_status = 'draft') 
      and has_permission(user_id, 'comment_content') then true
    -- Editors can publish approved content
    when new_status = 'published' 
      and current_status = 'approved'
      and has_permission(user_id, 'publish_content') then true
    -- Editors can archive published content
    when new_status = 'archived'
      and current_status = 'published'
      and has_permission(user_id, 'publish_content') then true
    -- Admins can do anything
    when has_permission(user_id, 'all') then true
    else false
  end;

  return valid_transition;
end;
$$;


ALTER FUNCTION "public"."can_transition_content_status"("user_id" "uuid", "content_id" "uuid", "new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_content_history"("content_id" "uuid") RETURNS TABLE("version_number" integer, "created_at" timestamp with time zone, "created_by_name" "text", "comment" "text", "data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return query
  select 
    v.version_number,
    v.created_at,
    p.name as created_by_name,
    v.comment,
    v.data
  from public.versions v
  left join public.profiles p on p.id = v.created_by
  where v.content_id = content_id
  order by v.version_number desc;
end;
$$;


ALTER FUNCTION "public"."get_content_history"("content_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'published'::"text", 'archived'::"text"]))),
    CONSTRAINT "valid_type" CHECK (("type" = ANY (ARRAY['article'::"text", 'recipe'::"text", 'pdp'::"text", 'collection'::"text", 'category'::"text"])))
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "data" "jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "version_number" integer NOT NULL,
    "comment" "text"
);


ALTER TABLE "public"."versions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."content_details" AS
 SELECT "c"."id",
    "c"."title",
    "c"."type",
    "c"."status",
    "c"."data",
    "c"."brand_id",
    "c"."created_by",
    "c"."updated_by",
    "c"."created_at",
    "c"."updated_at",
    "b"."name" AS "brand_name",
    "b"."slug" AS "brand_slug",
    "creator"."name" AS "creator_name",
    "updater"."name" AS "updater_name",
    ( SELECT "row_to_json"("v".*) AS "row_to_json"
           FROM "public"."versions" "v"
          WHERE ("v"."content_id" = "c"."id")
          ORDER BY "v"."version_number" DESC
         LIMIT 1) AS "latest_version"
   FROM ((("public"."content" "c"
     LEFT JOIN "public"."brands" "b" ON (("b"."id" = "c"."brand_id")))
     LEFT JOIN "public"."profiles" "creator" ON (("creator"."id" = "c"."created_by")))
     LEFT JOIN "public"."profiles" "updater" ON (("updater"."id" = "c"."updated_by")));


ALTER TABLE "public"."content_details" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_content"("user_id" "uuid", "content_type" "text" DEFAULT NULL::"text", "content_status" "text" DEFAULT NULL::"text", "brand_id" "uuid" DEFAULT NULL::"uuid") RETURNS SETOF "public"."content_details"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return query
  select cd.*
  from public.content_details cd
  where exists (
    select 1 from public.brand_users bu
    where bu.brand_id = cd.brand_id
    and bu.user_id = get_user_content.user_id
  )
  and (content_type is null or cd.type = content_type)
  and (content_status is null or cd.status = content_status)
  and (brand_id is null or cd.brand_id = brand_id)
  order by cd.updated_at desc;
end;
$$;


ALTER FUNCTION "public"."get_user_content"("user_id" "uuid", "content_type" "text", "content_status" "text", "brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_brand_access"("brand_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_brand_access
    WHERE user_id = auth.uid()
    AND brand_id = $1
  );
END;
$_$;


ALTER FUNCTION "public"."has_brand_access"("brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_brand_access"("user_id" "uuid", "target_brand_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1 from public.brand_users
    where user_id = user_id
    and brand_id = target_brand_id
  );
end;
$$;


ALTER FUNCTION "public"."has_brand_access"("user_id" "uuid", "target_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_permissions_view
    WHERE user_id = auth.uid()
    AND permissions @> ARRAY[permission_name]
  );
END;
$$;


ALTER FUNCTION "public"."has_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("user_id" "uuid", "required_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = user_id
    and (
      r.permissions @> array['all']
      or r.permissions @> array[required_permission]
    )
  );
end;
$$;


ALTER FUNCTION "public"."has_permission"("user_id" "uuid", "required_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_version_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  select coalesce(max(version_number), 0) + 1
  into new.version_number
  from public.versions
  where content_id = new.content_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_version_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_content_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (tg_op = 'UPDATE') then
    -- Only create a new version if data has changed
    if old.data != new.data then
      insert into public.versions (content_id, data, created_by)
      values (new.id, new.data, auth.uid());
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."track_content_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transition_content_status"("content_id" "uuid", "new_status" "text", "comment" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  current_user_id uuid;
begin
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Validate the transition
  if not public.can_transition_content_status(current_user_id, content_id, new_status) then
    raise exception 'Invalid status transition or insufficient permissions';
  end if;

  -- Update the content status
  update public.content
  set 
    status = new_status,
    updated_by = current_user_id
  where id = content_id;

  -- Create a version entry if comment provided
  if comment is not null then
    insert into public.versions (
      content_id,
      data,
      created_by,
      comment
    )
    select 
      id,
      data,
      current_user_id,
      comment
    from public.content
    where id = content_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."transition_content_status"("content_id" "uuid", "new_status" "text", "comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_before_save"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if not public.validate_content_data(new.type, new.data) then
    raise exception 'Invalid content data structure for type %', new.type;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."validate_content_before_save"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_data"("content_type" "text", "content_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  schema_valid boolean;
begin
  schema_valid := case content_type
    when 'article' then
      content_data ? 'body' and 
      content_data ? 'summary' and 
      jsonb_typeof(content_data->'body') = 'string' and
      jsonb_typeof(content_data->'summary') = 'string'
      
    when 'recipe' then
      content_data ? 'ingredients' and 
      content_data ? 'instructions' and 
      jsonb_typeof(content_data->'ingredients') = 'array' and
      jsonb_typeof(content_data->'instructions') = 'array'
      
    when 'pdp' then
      content_data ? 'description' and 
      content_data ? 'specifications' and 
      jsonb_typeof(content_data->'description') = 'string' and
      jsonb_typeof(content_data->'specifications') = 'object'
      
    when 'collection' then
      content_data ? 'description' and 
      content_data ? 'items' and 
      jsonb_typeof(content_data->'description') = 'string' and
      jsonb_typeof(content_data->'items') = 'array'
      
    when 'category' then
      content_data ? 'description' and 
      content_data ? 'metadata' and 
      jsonb_typeof(content_data->'description') = 'string' and
      jsonb_typeof(content_data->'metadata') = 'object'
      
    else false
  end;
  
  return schema_valid;
end;
$$;


ALTER FUNCTION "public"."validate_content_data"("content_type" "text", "content_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."articles" AS
 SELECT "c"."id",
    "c"."title",
    "c"."type",
    "c"."status",
    "c"."data",
    "c"."brand_id",
    "c"."created_by",
    "c"."updated_by",
    "c"."created_at",
    "c"."updated_at",
    ("c"."data" ->> 'body'::"text") AS "body",
    ("c"."data" ->> 'summary'::"text") AS "summary"
   FROM "public"."content" "c"
  WHERE ("c"."type" = 'article'::"text");


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brand_users" (
    "brand_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."brand_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role_id" "uuid",
    "brand_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pdps" AS
 SELECT "c"."id",
    "c"."title",
    "c"."type",
    "c"."status",
    "c"."data",
    "c"."brand_id",
    "c"."created_by",
    "c"."updated_by",
    "c"."created_at",
    "c"."updated_at",
    ("c"."data" ->> 'description'::"text") AS "description",
    ("c"."data" -> 'specifications'::"text") AS "specifications"
   FROM "public"."content" "c"
  WHERE ("c"."type" = 'pdp'::"text");


ALTER TABLE "public"."pdps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."recipes" AS
 SELECT "c"."id",
    "c"."title",
    "c"."type",
    "c"."status",
    "c"."data",
    "c"."brand_id",
    "c"."created_by",
    "c"."updated_by",
    "c"."created_at",
    "c"."updated_at",
    ("c"."data" -> 'ingredients'::"text") AS "ingredients",
    ("c"."data" -> 'instructions'::"text") AS "instructions"
   FROM "public"."content" "c"
  WHERE ("c"."type" = 'recipe'::"text");


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "permissions" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles_backup" (
    "id" "uuid",
    "name" "text",
    "permissions" "text"[],
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."roles_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_brand_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_brand_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_permissions_view" AS
 SELECT "u"."id" AS "user_id",
    "r"."name" AS "role_name",
    "array_agg"(DISTINCT "p"."name") AS "permissions",
    "array_agg"(DISTINCT "b"."name") AS "accessible_brand_names"
   FROM (((((("auth"."users" "u"
     LEFT JOIN "public"."user_roles" "ur" ON (("u"."id" = "ur"."user_id")))
     LEFT JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
     LEFT JOIN "public"."role_permissions" "rp" ON (("r"."id" = "rp"."role_id")))
     LEFT JOIN "public"."permissions" "p" ON (("rp"."permission_id" = "p"."id")))
     LEFT JOIN "public"."user_brand_access" "uba" ON (("u"."id" = "uba"."user_id")))
     LEFT JOIN "public"."brands" "b" ON (("uba"."brand_id" = "b"."id")))
  GROUP BY "u"."id", "r"."name";


ALTER TABLE "public"."user_permissions_view" OWNER TO "postgres";


ALTER TABLE ONLY "public"."brand_users"
    ADD CONSTRAINT "brand_users_pkey" PRIMARY KEY ("brand_id", "user_id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "unique_content_version" UNIQUE ("content_id", "version_number");



ALTER TABLE ONLY "public"."user_brand_access"
    ADD CONSTRAINT "user_brand_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_brand_access"
    ADD CONSTRAINT "user_brand_access_user_id_brand_id_key" UNIQUE ("user_id", "brand_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_pkey" PRIMARY KEY ("id");



CREATE INDEX "brands_name_idx" ON "public"."brands" USING "btree" ("name");



CREATE INDEX "roles_name_idx" ON "public"."roles" USING "btree" ("name");



CREATE INDEX "user_brand_access_brand_id_idx" ON "public"."user_brand_access" USING "btree" ("brand_id");



CREATE INDEX "user_brand_access_user_id_idx" ON "public"."user_brand_access" USING "btree" ("user_id");



CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_content_updated_at" BEFORE UPDATE ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_version_number" BEFORE INSERT ON "public"."versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_version_number"();



CREATE OR REPLACE TRIGGER "track_content_changes" AFTER UPDATE ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."track_content_changes"();



CREATE OR REPLACE TRIGGER "update_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_permissions_updated_at" BEFORE UPDATE ON "public"."permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_content_data" BEFORE INSERT OR UPDATE OF "data", "type" ON "public"."content" FOR EACH ROW EXECUTE FUNCTION "public"."validate_content_before_save"();



ALTER TABLE ONLY "public"."brand_users"
    ADD CONSTRAINT "brand_users_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brand_users"
    ADD CONSTRAINT "brand_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_brand_access"
    ADD CONSTRAINT "user_brand_access_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_brand_access"
    ADD CONSTRAINT "user_brand_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Admin can manage brand users" ON "public"."brand_users" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."roles"
          WHERE (("roles"."id" = "profiles"."role_id") AND ("roles"."permissions" @> ARRAY['all'::"text"]))))))));



CREATE POLICY "Admin can manage brands" ON "public"."brands" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."roles"
          WHERE (("roles"."id" = "profiles"."role_id") AND ("roles"."permissions" @> ARRAY['all'::"text"]))))))));



CREATE POLICY "Admins and brand approvers can create invitations" ON "public"."invitations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name" = 'admin'::"text") OR ("r"."name" = 'brand_approver'::"text"))))));



CREATE POLICY "Admins and brand approvers can manage brand associations" ON "public"."brand_users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND (("r"."name" = 'admin'::"text") OR ("r"."name" = 'brand_approver'::"text"))))));



CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins can manage brand access" ON "public"."user_brand_access" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins can manage brands" ON "public"."brands" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins can manage roles" ON "public"."roles" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins have full access to content" ON "public"."content" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Assignees can create versions for their content" ON "public"."versions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."content" "c"
  WHERE (("c"."id" = "versions"."content_id") AND ("c"."created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM ("public"."roles" "r"
             JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'assignee'::"text"))))))));



CREATE POLICY "Assignees can manage their own content" ON "public"."content" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'assignee'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."brand_users" "bu"
  WHERE (("bu"."brand_id" = "content"."brand_id") AND ("bu"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Assignees can update their own content" ON "public"."content" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'assignee'::"text"))))));



CREATE POLICY "Brand access manageable by users with manage:users permission" ON "public"."user_brand_access" TO "authenticated" USING ("public"."has_permission"('manage:users'::"text")) WITH CHECK ("public"."has_permission"('manage:users'::"text"));



CREATE POLICY "Brands deletable by users with delete:brands permission" ON "public"."brands" FOR DELETE TO "authenticated" USING ("public"."has_permission"('delete:brands'::"text"));



CREATE POLICY "Brands updatable by users with update:brands permission" ON "public"."brands" FOR UPDATE TO "authenticated" USING ("public"."has_permission"('update:brands'::"text")) WITH CHECK ("public"."has_permission"('update:brands'::"text"));



CREATE POLICY "Editor reviewers can create versions" ON "public"."versions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."content" "c"
     JOIN "public"."brand_users" "bu" ON (("bu"."brand_id" = "c"."brand_id")))
  WHERE (("c"."id" = "versions"."content_id") AND ("bu"."user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM ("public"."roles" "r"
             JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
          WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'editor_reviewer'::"text"))))))));



CREATE POLICY "Editor reviewers can update content" ON "public"."content" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'editor_reviewer'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."brand_users" "bu"
  WHERE (("bu"."brand_id" = "content"."brand_id") AND ("bu"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Only admins can delete versions" ON "public"."versions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Only admins can manage brands" ON "public"."brands" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Only admins can manage invitations" ON "public"."invitations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Only admins can manage role assignments" ON "public"."user_roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Permissions manageable by users with manage:roles permission" ON "public"."permissions" TO "authenticated" USING ("public"."has_permission"('manage:roles'::"text")) WITH CHECK ("public"."has_permission"('manage:roles'::"text"));



CREATE POLICY "Permissions viewable by all authenticated users" ON "public"."permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Publishers can update content" ON "public"."content" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'publisher'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."brand_users" "bu"
  WHERE (("bu"."brand_id" = "content"."brand_id") AND ("bu"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Role permissions manageable by users with manage:roles permissi" ON "public"."role_permissions" TO "authenticated" USING ("public"."has_permission"('manage:roles'::"text")) WITH CHECK ("public"."has_permission"('manage:roles'::"text"));



CREATE POLICY "Role permissions viewable by all authenticated users" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Roles are viewable by authenticated users" ON "public"."roles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Roles manageable by admin" ON "public"."roles" TO "authenticated" USING ((("name" = 'admin'::"text") OR ("permissions" @> ARRAY['all'::"text"])));



CREATE POLICY "Roles viewable by all authenticated users" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "User roles manageable by users with manage:users permission" ON "public"."user_roles" TO "authenticated" USING ("public"."has_permission"('manage:users'::"text")) WITH CHECK ("public"."has_permission"('manage:users'::"text"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view accessible brands" ON "public"."brands" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_brand_access" "uba"
  WHERE (("uba"."user_id" = "auth"."uid"()) AND ("uba"."brand_id" = "brands"."id")))));



CREATE POLICY "Users can view assigned brands" ON "public"."brands" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."brand_users" "bu"
  WHERE (("bu"."brand_id" = "brands"."id") AND ("bu"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text"))))));



CREATE POLICY "Users can view brand memberships" ON "public"."brand_users" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
           FROM "public"."roles"
          WHERE (("roles"."id" = "profiles"."role_id") AND ("roles"."permissions" @> ARRAY['all'::"text"])))))))));



CREATE POLICY "Users can view brands they have access to" ON "public"."brands" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."brand_users"
  WHERE (("brand_users"."brand_id" = "brands"."id") AND ("brand_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view content for their brands" ON "public"."content" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."brand_users" "bu"
  WHERE (("bu"."brand_id" = "content"."brand_id") AND ("bu"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text"))))));



CREATE POLICY "Users can view content from their brands" ON "public"."content" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."brand_users"
  WHERE (("brand_users"."brand_id" = "content"."brand_id") AND ("brand_users"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view invitations sent to their email" ON "public"."invitations" FOR SELECT TO "authenticated" USING ((("email" = "auth"."email"()) OR ("invited_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text"))))));



CREATE POLICY "Users can view roles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Users can view their own brand access" ON "public"."user_brand_access" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own brand associations" ON "public"."brand_users" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text"))))));



CREATE POLICY "Users can view their own role assignments" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view versions for accessible content" ON "public"."versions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."content" "c"
     JOIN "public"."brand_users" "bu" ON (("bu"."brand_id" = "c"."brand_id")))
  WHERE (("c"."id" = "versions"."content_id") AND ("bu"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."roles" "r"
     JOIN "public"."user_roles" "ur" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text"))))));



CREATE POLICY "Users can view versions of accessible content" ON "public"."versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."content" "c"
     JOIN "public"."brand_users" "bu" ON (("bu"."brand_id" = "c"."brand_id")))
  WHERE (("c"."id" = "versions"."content_id") AND ("bu"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users with create_content permission can insert content" ON "public"."content" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("r"."id" = "p"."role_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("r"."permissions" @> ARRAY['create_content'::"text"]) OR ("r"."permissions" @> ARRAY['all'::"text"]))))));



CREATE POLICY "Users with delete_content permission can delete content" ON "public"."content" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("r"."id" = "p"."role_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("r"."permissions" @> ARRAY['delete_content'::"text"]) OR ("r"."permissions" @> ARRAY['all'::"text"]))))));



CREATE POLICY "Users with edit_content permission can create versions" ON "public"."versions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("r"."id" = "p"."role_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("r"."permissions" @> ARRAY['edit_content'::"text"]) OR ("r"."permissions" @> ARRAY['all'::"text"]))))));



CREATE POLICY "Users with edit_content permission can update content" ON "public"."content" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("r"."id" = "p"."role_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND (("r"."permissions" @> ARRAY['edit_content'::"text"]) OR ("r"."permissions" @> ARRAY['all'::"text"]))))));



ALTER TABLE "public"."brand_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_brand_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."versions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("p_user_id" "uuid", "p_invitation_id" "uuid", "p_role_id" "uuid", "p_brand_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_user_id" "uuid", "p_invitation_id" "uuid", "p_role_id" "uuid", "p_brand_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("p_user_id" "uuid", "p_invitation_id" "uuid", "p_role_id" "uuid", "p_brand_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_user_to_brand"("admin_user_id" "uuid", "target_user_id" "uuid", "target_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_to_brand"("admin_user_id" "uuid", "target_user_id" "uuid", "target_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_to_brand"("admin_user_id" "uuid", "target_user_id" "uuid", "target_brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_transition_content_status"("user_id" "uuid", "content_id" "uuid", "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_transition_content_status"("user_id" "uuid", "content_id" "uuid", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_transition_content_status"("user_id" "uuid", "content_id" "uuid", "new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_history"("content_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_content_history"("content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_history"("content_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."content" TO "anon";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT ALL ON TABLE "public"."content" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."versions" TO "anon";
GRANT ALL ON TABLE "public"."versions" TO "authenticated";
GRANT ALL ON TABLE "public"."versions" TO "service_role";



GRANT ALL ON TABLE "public"."content_details" TO "anon";
GRANT ALL ON TABLE "public"."content_details" TO "authenticated";
GRANT ALL ON TABLE "public"."content_details" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_content"("user_id" "uuid", "content_type" "text", "content_status" "text", "brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_content"("user_id" "uuid", "content_type" "text", "content_status" "text", "brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_content"("user_id" "uuid", "content_type" "text", "content_status" "text", "brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_brand_access"("brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_brand_access"("brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_brand_access"("brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_brand_access"("user_id" "uuid", "target_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_brand_access"("user_id" "uuid", "target_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_brand_access"("user_id" "uuid", "target_brand_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "required_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "required_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "required_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_version_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_version_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_version_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_content_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_content_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_content_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."transition_content_status"("content_id" "uuid", "new_status" "text", "comment" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."transition_content_status"("content_id" "uuid", "new_status" "text", "comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transition_content_status"("content_id" "uuid", "new_status" "text", "comment" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_content_before_save"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_content_before_save"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_content_before_save"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_content_data"("content_type" "text", "content_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_content_data"("content_type" "text", "content_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_content_data"("content_type" "text", "content_data" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."brand_users" TO "anon";
GRANT ALL ON TABLE "public"."brand_users" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_users" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."pdps" TO "anon";
GRANT ALL ON TABLE "public"."pdps" TO "authenticated";
GRANT ALL ON TABLE "public"."pdps" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."roles_backup" TO "anon";
GRANT ALL ON TABLE "public"."roles_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."roles_backup" TO "service_role";



GRANT ALL ON TABLE "public"."user_brand_access" TO "anon";
GRANT ALL ON TABLE "public"."user_brand_access" TO "authenticated";
GRANT ALL ON TABLE "public"."user_brand_access" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
