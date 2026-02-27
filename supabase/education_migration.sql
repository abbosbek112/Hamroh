-- =========================================================================================
-- HAMROH FOR EDUCATION — O'QUV MARKAZ TIZIMI
-- =========================================================================================
-- Run this in Supabase SQL Editor AFTER the main COMPLETE_DATABASE_SETUP.sql
-- Creates: organizations, organization_members, classes tables with RLS
-- =========================================================================================

-- Extensions (should already exist from main setup)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================================
-- SECTION 1: ORGANIZATIONS TABLE (O'quv markazlar)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  logo_url text,
  invite_code text UNIQUE NOT NULL,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subscription_plan text DEFAULT 'free', -- 'free', 'starter', 'standard'
  max_students int DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Generate unique invite code function
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate 8-char alphanumeric code
    v_code := upper(substr(md5(random()::text), 1, 4) || '-' || substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE invite_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for organizations
DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;
CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT
  USING (
    -- Owner can see
    auth.uid() = owner_id
    OR
    -- Members can see
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = organizations.id AND user_id = auth.uid()
    )
  );

-- Anyone can view org by invite code (for joining)
DROP POLICY IF EXISTS "Anyone can view org by invite code" ON public.organizations;
CREATE POLICY "Anyone can view org by invite code"
  ON public.organizations FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

DROP POLICY IF EXISTS "Org owners can update their org" ON public.organizations;
CREATE POLICY "Org owners can update their org"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Org owners can delete their org" ON public.organizations;
CREATE POLICY "Org owners can delete their org"
  ON public.organizations FOR DELETE
  USING (auth.uid() = owner_id);

-- =========================================================================================
-- SECTION 2: CLASSES TABLE (Sinflar/Kurslar)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view classes" ON public.classes;
CREATE POLICY "Org members can view classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = classes.org_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = classes.org_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org admins can manage classes" ON public.classes;
CREATE POLICY "Org admins can manage classes"
  ON public.classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = classes.org_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = classes.org_id AND user_id = auth.uid() AND role = 'teacher'
    )
  );

-- =========================================================================================
-- SECTION 3: ORGANIZATION MEMBERS TABLE (A'zolar)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'student', -- 'teacher', 'student'
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper: recursionsiz membership tekshirish (SECURITY DEFINER = RLS bypass)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.organization_members
    WHERE org_id = p_org_id AND user_id = p_user_id
  ) OR EXISTS(
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id AND owner_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Org members can view other members" ON public.organization_members;
CREATE POLICY "Org members can view other members"
  ON public.organization_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    public.is_org_member(org_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can join orgs" ON public.organization_members;
CREATE POLICY "Users can join orgs"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    -- Foydalanuvchi o'zi qo'shiladi
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.org_id
    ))
    OR
    -- Platform admin har kimni qo'sha oladi
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Org owner o'z markaziga qo'sha oladi
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.org_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org admins can update members" ON public.organization_members;
CREATE POLICY "Org admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.org_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid() AND om.role = 'teacher'
    )
  );

DROP POLICY IF EXISTS "Org admins can remove members" ON public.organization_members;
CREATE POLICY "Org admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    -- Org owner can remove anyone
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.org_id AND owner_id = auth.uid()
    )
    OR
    -- Org admins can remove
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid() AND om.role = 'teacher'
    )
    OR
    -- Users can leave org themselves
    auth.uid() = user_id
  );

-- =========================================================================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- =========================================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations(invite_code);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_classes_org_id ON public.classes(org_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);

-- =========================================================================================
-- SECTION 5: HELPER FUNCTIONS
-- =========================================================================================

-- RPC: Get student analytics for an organization (org admin/teacher only)
CREATE OR REPLACE FUNCTION public.get_org_student_analytics(p_org_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar text,
  xp int,
  level int,
  streak int,
  focus_minutes int,
  last_active timestamptz,
  todos_completed bigint,
  todos_total bigint,
  routines_completed bigint,
  routines_total bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id uuid;
  v_is_authorized boolean;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if caller is org owner or admin
  SELECT EXISTS(
    SELECT 1 FROM public.organizations WHERE id = p_org_id AND owner_id = v_caller_id
    UNION ALL
    SELECT 1 FROM public.organization_members
    WHERE org_id = p_org_id AND user_id = v_caller_id AND role = 'teacher'
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to view this organization';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.avatar,
    u.xp,
    u.level,
    u.streak,
    COALESCE(u.focus_minutes, 0),
    u.last_active,
    (SELECT COUNT(*)::bigint FROM public.todos t WHERE t.user_id = u.id AND t.completed = true),
    (SELECT COUNT(*)::bigint FROM public.todos t WHERE t.user_id = u.id),
    (SELECT COUNT(*)::bigint FROM public.routine_tasks rt WHERE rt.user_id = u.id AND rt.completed = true AND rt.date >= CURRENT_DATE - INTERVAL '7 days'),
    (SELECT COUNT(*)::bigint FROM public.routine_tasks rt WHERE rt.user_id = u.id AND rt.date >= CURRENT_DATE - INTERVAL '7 days')
  FROM public.organization_members om
  INNER JOIN public.users u ON u.id = om.user_id
  WHERE om.org_id = p_org_id AND om.role = 'student'
  ORDER BY u.xp DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_student_analytics(uuid) TO authenticated;

-- =========================================================================================
-- SECTION 6: ENABLE REALTIME
-- =========================================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'organizations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'organization_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'classes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
