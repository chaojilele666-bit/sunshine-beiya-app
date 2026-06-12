-- Sunshine Beiya demo seed data.
-- This data is safe for local development and does not contain real customer information.

BEGIN;

INSERT INTO users (id, phone, email, password_hash, full_name, role, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', '13800000001', 'admin@sunshine-beiya.local', '$argon2id$placeholder-do-not-use-in-production', '系统管理员', 'admin', 'active'),
  ('22222222-2222-2222-2222-222222222222', '13800000002', 'customer01@sunshine-beiya.local', '$argon2id$placeholder-do-not-use-in-production', '测试客户', 'customer', 'active'),
  ('33333333-3333-3333-3333-333333333333', '13800000003', 'worker01@sunshine-beiya.local', '$argon2id$placeholder-do-not-use-in-production', '测试家政员', 'worker', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_profiles (user_id, gender, notes)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'unknown', '本地开发测试客户')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO worker_profiles (user_id, id_card_last4, years_experience, bio, service_city, verification_status, rating, completed_order_count)
VALUES
  ('33333333-3333-3333-3333-333333333333', '0000', 5, '本地开发测试家政员，支持保洁、深度清洁等服务。', '北京', 'verified', 4.80, 28)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO addresses (id, user_id, contact_name, contact_phone, province, city, district, street_address, is_default)
VALUES
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '测试客户', '13800000002', '北京市', '北京市', '朝阳区', '测试小区 1 号楼 101', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_categories (id, name, description, sort_order)
VALUES
  ('55555555-5555-5555-5555-555555555551', '日常保洁', '家庭日常清洁服务', 10),
  ('55555555-5555-5555-5555-555555555552', '深度清洁', '厨房、卫生间、全屋深度清洁服务', 20),
  ('55555555-5555-5555-5555-555555555553', '长期家政', '长期保姆、住家服务、老人陪护等服务', 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_items (id, category_id, name, description, base_price_cents, pricing_unit, estimated_duration_minutes)
VALUES
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', '两小时日常保洁', '适合小户型日常清洁。', 12800, 'order', 120),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', '厨房深度清洁', '包含油污处理、台面清洁、橱柜外部清洁。', 29800, 'order', 180),
  ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555553', '长期家政面谈', '长期家政服务前置需求沟通。', 0, 'order', 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO worker_service_items (worker_id, service_item_id, price_cents, is_available)
VALUES
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666661', 12800, true),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666662', 29800, true),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666663', 0, true)
ON CONFLICT (worker_id, service_item_id) DO NOTHING;

INSERT INTO orders (id, order_no, customer_id, worker_id, service_item_id, address_id, status, scheduled_start, scheduled_end, total_amount_cents, customer_note)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'SB202606120001', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444444', 'confirmed', '2026-06-15 09:00:00+08', '2026-06-15 11:00:00+08', 12800, '请重点清洁客厅和卫生间。')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, order_id, provider, provider_trade_no, amount_cents, status, paid_at)
VALUES
  ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'manual', 'LOCAL-SEED-001', 12800, 'paid', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'seed_database', 'database', NULL, '{"source":"database/init/002_seed.sql"}'::jsonb);

COMMIT;
