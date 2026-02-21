-- =========================================================================================
-- Faqat check_in_challenge RPC ni yaratish (404 bo'lsa Supabase SQL Editor'da bajarish)
-- =========================================================================================

CREATE OR REPLACE FUNCTION public.check_in_challenge(p_challenge_id text, p_reward_xp int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_challenge(text, int) TO service_role;

NOTIFY pgrst, 'reload config';
