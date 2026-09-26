-- PolyCore Nexus — Demo User Seed
-- Passwords are bcrypt hash cost 12
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
    -- bcrypt hash of 'PolyCoreAdmin2024!' cost 12
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6yxgqGm',
    role_admin_id,
    true,
    true
  ) ON CONFLICT (email) DO NOTHING;

  -- Developer user
  INSERT INTO users (id, email, username, display_name, password_hash, role_id, is_active, email_verified)
  VALUES (
    gen_random_uuid(),
    'dev@polycore.dev',
    'devuser',
    'Dev User',
    -- bcrypt hash of 'DevUser2024!' cost 12
    '$2a$12$8K1p/a0dLRxBtOQHkzBCOeX4j4iyLzCLYJJ.xvFGZ4S.7BPGZaXyW',
    role_dev_id,
    true,
    true
  ) ON CONFLICT (email) DO NOTHING;

  -- Regular user
  INSERT INTO users (id, email, username, display_name, password_hash, role_id, is_active, email_verified)
  VALUES (
    gen_random_uuid(),
    'user@polycore.dev',
    'demouser',
    'Demo User',
    -- bcrypt hash of 'UserDemo2024!' cost 12
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role_user_id,
    true,
    true
  ) ON CONFLICT (email) DO NOTHING;

END $$;
