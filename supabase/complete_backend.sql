-- =========================================================================================
-- HAMROH AI - TO'LIQ BACKEND (Supabase SQL Editor'da ishga tushiring)
-- =========================================================================================
-- Bu fayl challenge check-in, store va boshqa backend funksiyalarni o'z ichiga oladi.
-- Supabase Dashboard > SQL Editor > New query > paste > Run
-- =========================================================================================

-- =========================================================================================
-- 1. USERS - inventory ustuni (agar bo'lmasa)
-- =========================================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'inventory'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN inventory text[] default '{}'::text[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'double_xp_expires_at') THEN
    ALTER TABLE public.users ADD COLUMN double_xp_expires_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'app_theme') THEN
    ALTER TABLE public.users ADD COLUMN app_theme text;
  END IF;
END $$;

-- =========================================================================================
-- 2. CHALLENGE_PARTICIPANTS - kerakli ustunlar
-- =========================================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'total_check_ins') THEN
    ALTER TABLE public.challenge_participants ADD COLUMN total_check_ins integer default 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'last_check_in') THEN
    ALTER TABLE public.challenge_participants ADD COLUMN last_check_in timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenge_participants' AND column_name = 'joined_at') THEN
    ALTER TABLE public.challenge_participants ADD COLUMN joined_at timestamptz default now();
  END IF;
END $$;

-- =========================================================================================
-- 3. CHECK-IN RPC - 1 kun 1 check, race-condition'siz
-- =========================================================================================
CREATE OR REPLACE FUNCTION public.check_in_challenge(p_challenge_id text, p_reward_xp int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_last_check_in timestamptz;
    v_total_check_ins int;
    v_today date;
    v_last_check_in_date date;
    v_yesterday date;
    v_last_check_in_date_only date;
    v_reward_xp int;
    v_new_streak int;
    v_current_streak int;
    v_double_xp_expires_at timestamptz;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN 'UNAUTHORIZED'; END IF;

    SELECT last_check_in, total_check_ins 
    INTO v_last_check_in, v_total_check_ins
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id FOR UPDATE;

    IF NOT FOUND THEN RETURN 'NOT_JOINED'; END IF;

    v_today := current_date;
    IF v_last_check_in IS NOT NULL THEN
        v_last_check_in_date := v_last_check_in::date;
        IF v_last_check_in_date = v_today THEN RETURN 'ALREADY_CHECKED_IN'; END IF;
    END IF;

    UPDATE public.challenge_participants
    SET last_check_in = now(), total_check_ins = COALESCE(v_total_check_ins, 0) + 1
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

    SELECT double_xp_expires_at, streak INTO v_double_xp_expires_at, v_current_streak
    FROM public.users WHERE id = v_user_id;
    v_reward_xp := p_reward_xp;
    IF v_double_xp_expires_at IS NOT NULL AND now() < v_double_xp_expires_at THEN
        v_reward_xp := p_reward_xp * 2;
    END IF;

    v_yesterday := v_today - interval '1 day';
    IF v_last_check_in IS NULL THEN
        v_new_streak := 1;
    ELSE
        v_last_check_in_date_only := v_last_check_in::date;
        IF v_last_check_in_date_only = v_yesterday::date THEN
            v_new_streak := COALESCE(v_current_streak, 0) + 1;
        ELSE
            v_new_streak := 1;
        END IF;
    END IF;

    UPDATE public.users SET xp = xp + v_reward_xp, streak = v_new_streak WHERE id = v_user_id;
    RETURN 'SUCCESS';
END;
$$;

-- RPC ni authenticated foydalanuvchilar chaqira olishi uchun
GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO service_role;

-- =========================================================================================
-- 4. Level formulasi (1000 XP = 1 level, API bilan mos)
-- =========================================================================================
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF xp < 0 THEN RETURN 1; END IF;
    RETURN FLOOR(xp / 1000) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================================================================
-- 5. PostgREST schema cache yangilash
-- =========================================================================================
NOTIFY pgrst, 'reload config';
