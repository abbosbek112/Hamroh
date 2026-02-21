-- 1. Add missing inventory column to users table
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

-- 2. Create atomic RPC function for challenge check-in to prevent race conditions
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
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN 'UNAUTHORIZED';
    END IF;

    -- Get participation data
    SELECT last_check_in, total_check_ins 
    INTO v_last_check_in, v_total_check_ins
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id FOR UPDATE; -- FOR UPDATE locks the row to prevent race conditions

    IF NOT FOUND THEN
        RETURN 'NOT_JOINED';
    END IF;

    -- Compare dates (using timezone of the database or UTC)
    -- This relies on casting timestamptz to date
    v_today := current_date;
    IF v_last_check_in IS NOT NULL THEN
        v_last_check_in_date := v_last_check_in::date;
        IF v_last_check_in_date = v_today THEN
            RETURN 'ALREADY_CHECKED_IN';
        END IF;
    END IF;

    -- Update participation
    UPDATE public.challenge_participants
    SET 
        last_check_in = now(),
        total_check_ins = COALESCE(v_total_check_ins, 0) + 1
    WHERE challenge_id = p_challenge_id AND user_id = v_user_id;

    -- Add XP
    UPDATE public.users
    SET xp = xp + p_reward_xp
    WHERE id = v_user_id;

    RETURN 'SUCCESS';
END;
$$;
