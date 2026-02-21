-- Add missing columns to challenge_participants table

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

-- Reload schema cache
NOTIFY pgrst, 'reload config';
