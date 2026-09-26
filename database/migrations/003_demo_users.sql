-- PolyCore Nexus — Demo User Seed
-- Verified bcrypt hashes generated with Go bcrypt cost 12
-- admin@polycore.dev   / PolyCoreAdmin2024!
-- dev@polycore.dev     / DevUser2024!
-- user@polycore.dev    / UserDemo2024!

DO $$
DECLARE
  role_admin_id UUID;
  role_dev_id   UUID;
  role_user_id  UUID;
BEGIN

  SELECT id INTO role_admin_id FROM roles WHERE name = 'admin';
  SELECT id INTO role_dev_id   FROM roles WHERE name = 'developer';
  SELECT id INTO role_user_id  FROM roles WHERE name = 'user';

  -- Admin user
  INSERT INTO users (id, email, username, display_name, password_hash, role_id, is_active, email_verified)
  VALUES (
    gen_random_uuid(),
    'admin@polycore.dev',
    'admin',
    'PolyCore Admin',
    '$2a$12$cppKXKhHKoEF.a9MAd1oJ.1jxT7Ds2fj/NYG93jY8J3e2RpZth6WK',
    role_admin_id,
    true,
    true
  ) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

  -- Developer user
  INSERT INTO users (id, email, username, display_name, password_hash, role_id, is_active, email_verified)
  VALUES (
    gen_random_uuid(),
    'dev@polycore.dev',
    'devuser',
    'Dev User',
    '$2a$12$tFYu5gUta//Q/VtNQogAeudWRO5DemcBm1EpAwPQ6C702qODQDTaG',
    role_dev_id,
    true,
    true
  ) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

  -- Regular user
  INSERT INTO users (id, email, username, display_name, password_hash, role_id, is_active, email_verified)
  VALUES (
    gen_random_uuid(),
    'user@polycore.dev',
    'demouser',
    'Demo User',
    '$2a$12$T7.oYVJUrtoQELY5G1E1s.xcpOJ7wm56XC6c9TLLFxXLbLm2dPb0q',
    role_user_id,
    true,
    true
  ) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

END $$;
