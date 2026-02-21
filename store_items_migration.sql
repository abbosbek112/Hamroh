-- Create store_items table
CREATE TABLE IF NOT EXISTS store_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('UTILITY', 'THEME', 'BADGE')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  icon TEXT NOT NULL,
  value TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view store items" ON store_items FOR SELECT USING (true);

-- Only admins can insert/update/delete
-- Assuming 'admin' role check is done via users table join or metadata. 
-- For simplicity in this SQL editor context, we might rely on the API logic or a specific user ID check if known.
-- A common pattern in Supabase is checking app_metadata or a profiles table.
-- Here we use the users table as per previous context.

CREATE POLICY "Admins can insert store items" ON store_items FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

CREATE POLICY "Admins can update store items" ON store_items FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

CREATE POLICY "Admins can delete store items" ON store_items FOR DELETE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Initial Data Migration
INSERT INTO store_items (id, type, name, description, price, icon, value) VALUES
('streak_freeze', 'UTILITY', 'Streak Muzlatgich', 'Bir kunlik mashg''ulotni o''tkazib yuborsangiz ham, streak saqlanib qoladi.', 500, '❄️', NULL),
('double_xp', 'UTILITY', '2x XP (1 soat)', 'Keyingi 1 soat davomida bajarilgan vazifalar uchun 2 barobar ko''p XP oling.', 300, '⚡', NULL),
('theme_dark_nebula', 'THEME', 'Dark Nebula', 'Chuqur koinot ranglari va yulduzli fon.', 1000, '🌌', 'dark_nebula'),
('theme_sunset_vibes', 'THEME', 'Sunset Vibes', 'Quyosh botishi ranglari va iliq atmosfera.', 800, '🌅', 'sunset_vibes'),
('theme_cyberpunk', 'THEME', 'Cyberpunk', 'Neon chiroqlar va futuristik dizayn.', 1200, '🤖', 'cyberpunk'),
('badge_supporter', 'BADGE', 'Loyiha Homiyi', 'Hamroh AI rivojiga hissa qo''shganingiz uchun maxsus belgi.', 5000, '💎', 'badge_supporter_id'),
('badge_early_bird', 'BADGE', 'Erta Qush', 'Loyiha endi boshlangan paytda qo''shilganlar uchun.', 2000, '🐦', 'badge_early_bird_id')
ON CONFLICT (id) DO NOTHING;
