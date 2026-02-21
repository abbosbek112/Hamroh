-- =========================================================================================
-- Reyting (leaderboard) uchun: barcha ishtirokchilarni ko'rishga ruxsat
-- =========================================================================================
-- Bu faylni Supabase SQL Editor'da ishga tushiring. Shundan keyin musobaqa modalida
-- haqiqiy reyting (API dan) ko'rinadi.
--
-- Check-in ishlamashi uchun: COMPLETE_DATABASE_SETUP.sql faylida check_in_challenge RPC
-- va challenge_participants jadvalidagi total_check_ins, last_check_in, joined_at
-- ustunlari bo'lishi kerak. Agar 404 xatolik chiqsa, COMPLETE_DATABASE_SETUP.sql ni
-- (yoki supabase/complete_backend.sql) Supabase SQL Editor'da ishga tushiring.
-- =========================================================================================

DROP POLICY IF EXISTS "Challenge participants viewable for leaderboard" ON public.challenge_participants;
CREATE POLICY "Challenge participants viewable for leaderboard"
  ON public.challenge_participants
  FOR SELECT
  USING (true);
