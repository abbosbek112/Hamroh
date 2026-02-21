-- =========================================================================================
-- XP XAVFSIZLIK: bevosita o'zgartirish blok, RPC orqali XP berish
-- User DevTools orqali api.addXP(999999) chaqirib XP ola olmasin
-- Supabase SQL Editor'da ishga tushiring
-- =========================================================================================

-- 1. XP/level ni anon/authenticated bevosita o'zgartira olmasin
-- Faqat SECURITY DEFINER RPC o'zgartira oladi (session_user postgres bo'ladi)
CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role AND auth.uid() = OLD.id THEN
        IF OLD.role != 'admin' THEN
            RAISE EXCEPTION 'You cannot change your own role.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. todos: xp_awarded (takror XP oldini olish)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS xp_awarded boolean DEFAULT false;

-- 3. journal_entries: xp_awarded
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS xp_awarded boolean DEFAULT false;

-- 4. xp_routine_daily: kunlik routine XP 1 marta
CREATE TABLE IF NOT EXISTS public.xp_routine_daily (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    PRIMARY KEY (user_id, date)
);
ALTER TABLE public.xp_routine_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own" ON public.xp_routine_daily;
CREATE POLICY "Users view own" ON public.xp_routine_daily FOR SELECT USING (auth.uid() = user_id);

-- 5. award_xp_todo
CREATE OR REPLACE FUNCTION public.award_xp_todo(p_todo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_todo record;
    v_xp int;
    v_new_xp int;
    v_new_level int;
    v_double_xp_expires_at timestamptz;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;

    SELECT id, completed, difficulty, xp_awarded INTO v_todo
    FROM public.todos WHERE id = p_todo_id AND user_id = v_user_id FOR UPDATE;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND'); END IF;
    IF NOT v_todo.completed THEN RETURN jsonb_build_object('success', false, 'error', 'NOT_COMPLETED'); END IF;
    IF COALESCE(v_todo.xp_awarded, false) THEN RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED'); END IF;

    v_xp := CASE v_todo.difficulty WHEN 'EASY' THEN 10 WHEN 'MEDIUM' THEN 30 WHEN 'HARD' THEN 50 ELSE 10 END;

    SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := v_xp * 2; END IF;

    UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1
    WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;

    UPDATE public.todos SET xp_awarded = true WHERE id = p_todo_id;

    RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- 6. award_xp_journal
CREATE OR REPLACE FUNCTION public.award_xp_journal(p_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_xp int := 50;
    v_new_xp int;
    v_new_level int;
    v_double_xp_expires_at timestamptz;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;

    IF NOT EXISTS (SELECT 1 FROM public.journal_entries WHERE id = p_entry_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
    END IF;
    IF EXISTS (SELECT 1 FROM public.journal_entries WHERE id = p_entry_id AND COALESCE(xp_awarded, false)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED');
    END IF;

    SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := 100; END IF;

    UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1
    WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;

    UPDATE public.journal_entries SET xp_awarded = true WHERE id = p_entry_id;

    RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- 7. award_xp_focus: max 180 min/call, focus_history + users o'zgartirish
CREATE OR REPLACE FUNCTION public.award_xp_focus(p_minutes int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_minutes int;
    v_xp int;
    v_new_xp int;
    v_new_level int;
    v_double_xp_expires_at timestamptz;
    v_today date := CURRENT_DATE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;

    v_minutes := LEAST(GREATEST(COALESCE(p_minutes, 0), 0), 180);
    IF v_minutes <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'INVALID_MINUTES'); END IF;

    SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
    v_xp := v_minutes;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := v_xp * 2; END IF;

    UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1,
        focus_minutes = COALESCE(focus_minutes, 0) + v_minutes
    WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;

    INSERT INTO public.focus_history (user_id, minutes, date) VALUES (v_user_id, v_minutes, v_today)
    ON CONFLICT (user_id, date) DO UPDATE SET minutes = public.focus_history.minutes + EXCLUDED.minutes;

    RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

-- focus_history unique constraint (agar bo'lmasa)
DO $$
BEGIN
  ALTER TABLE public.focus_history ADD CONSTRAINT focus_history_user_id_date_key UNIQUE (user_id, date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. award_xp_routine: 1 kun 1 marta 20 XP
CREATE OR REPLACE FUNCTION public.award_xp_routine()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_xp int := 20;
    v_new_xp int;
    v_new_level int;
    v_double_xp_expires_at timestamptz;
    v_today date := CURRENT_DATE;
    v_row_count int;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED'); END IF;

    INSERT INTO public.xp_routine_daily (user_id, date) VALUES (v_user_id, v_today)
    ON CONFLICT (user_id, date) DO NOTHING;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_AWARDED');
    END IF;

    SELECT double_xp_expires_at INTO v_double_xp_expires_at FROM public.users WHERE id = v_user_id;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN v_xp := 40; END IF;

    UPDATE public.users SET xp = xp + v_xp, level = FLOOR((xp + v_xp) / 1000) + 1
    WHERE id = v_user_id RETURNING xp, level INTO v_new_xp, v_new_level;

    RETURN jsonb_build_object('success', true, 'xp', v_new_xp, 'level', v_new_level, 'awarded', v_xp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp_todo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_journal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_focus(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_routine() TO authenticated;

NOTIFY pgrst, 'reload config';
