-- Check-in fallback ishlashi uchun: XP/level blokini olib tashlash
-- Supabase SQL Editor'da bajarish kifoya

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
