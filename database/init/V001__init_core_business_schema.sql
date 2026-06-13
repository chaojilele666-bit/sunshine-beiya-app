CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  phone varchar(32) NOT NULL,
  wechat_openid varchar(128),
  source varchar(40) NOT NULL DEFAULT 'manual',
  status varchar(24) NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_phone_unique UNIQUE (phone),
  CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'blocked')),
  CONSTRAINT customers_phone_check CHECK (phone ~ '^[0-9+ -]{6,32}$')
);

CREATE TABLE IF NOT EXISTS housekeepers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  phone varchar(32) NOT NULL,
  gender varchar(16) NOT NULL DEFAULT 'female',
  birth_year integer,
  hometown varchar(120),
  experience_years integer NOT NULL DEFAULT 0,
  live_in_available boolean NOT NULL DEFAULT false,
  status varchar(24) NOT NULL DEFAULT 'pending_review',
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT housekeepers_phone_unique UNIQUE (phone),
  CONSTRAINT housekeepers_phone_check CHECK (phone ~ '^[0-9+ -]{6,32}$'),
  CONSTRAINT housekeepers_gender_check CHECK (gender IN ('female', 'male', 'other')),
  CONSTRAINT housekeepers_birth_year_check CHECK (birth_year IS NULL OR birth_year BETWEEN 1950 AND EXTRACT(YEAR FROM now())::integer),
  CONSTRAINT housekeepers_experience_check CHECK (experience_years >= 0),
  CONSTRAINT housekeepers_status_check CHECK (status IN ('pending_review', 'approved', 'suspended', 'inactive'))
);

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL,
  name varchar(80) NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_categories_code_unique UNIQUE (code),
  CONSTRAINT service_categories_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  code varchar(40) NOT NULL,
  name varchar(80) NOT NULL,
  unit varchar(24) NOT NULL DEFAULT 'month',
  base_price_min numeric(12,2),
  base_price_max numeric(12,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_items_code_unique UNIQUE (code),
  CONSTRAINT service_items_category_name_unique UNIQUE (category_id, name),
  CONSTRAINT service_items_unit_check CHECK (unit IN ('hour', 'day', 'month', 'case')),
  CONSTRAINT service_items_price_check CHECK (
    base_price_min IS NULL
    OR base_price_max IS NULL
    OR base_price_min <= base_price_max
  )
);

CREATE TABLE IF NOT EXISTS service_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_name varchar(80) NOT NULL,
  contact_phone varchar(32) NOT NULL,
  province varchar(80) NOT NULL DEFAULT '北京',
  city varchar(80) NOT NULL DEFAULT '北京',
  district varchar(80),
  detail_address varchar(255) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_addresses_contact_phone_check CHECK (contact_phone ~ '^[0-9+ -]{6,32}$')
);

CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no varchar(40) NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_item_id uuid NOT NULL REFERENCES service_items(id) ON DELETE RESTRICT,
  service_address_id uuid REFERENCES service_addresses(id) ON DELETE SET NULL,
  requested_start_date date,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  family_requirements text,
  source varchar(40) NOT NULL DEFAULT 'manual',
  consultant_name varchar(80),
  status varchar(32) NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_orders_order_no_unique UNIQUE (order_no),
  CONSTRAINT service_orders_status_check CHECK (status IN ('new', 'follow_up', 'matching', 'interviewing', 'assigned', 'in_service', 'completed', 'cancelled')),
  CONSTRAINT service_orders_budget_check CHECK (
    budget_min IS NULL
    OR budget_max IS NULL
    OR budget_min <= budget_max
  )
);

CREATE TABLE IF NOT EXISTS manual_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  housekeeper_id uuid NOT NULL REFERENCES housekeepers(id) ON DELETE RESTRICT,
  dispatch_status varchar(32) NOT NULL DEFAULT 'proposed',
  assigned_by varchar(80) NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manual_dispatches_order_housekeeper_unique UNIQUE (service_order_id, housekeeper_id),
  CONSTRAINT manual_dispatches_status_check CHECK (dispatch_status IN ('proposed', 'accepted', 'rejected', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  from_status varchar(32),
  to_status varchar(32) NOT NULL,
  changed_by varchar(80) NOT NULL,
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_to_status_check CHECK (to_status IN ('new', 'follow_up', 'matching', 'interviewing', 'assigned', 'in_service', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS customer_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  channel varchar(32) NOT NULL,
  direction varchar(16) NOT NULL,
  content text NOT NULL,
  handled_by varchar(80) NOT NULL,
  communicated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_communications_channel_check CHECK (channel IN ('phone', 'wechat', 'sms', 'offline', 'system')),
  CONSTRAINT customer_communications_direction_check CHECK (direction IN ('inbound', 'outbound'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  housekeeper_id uuid REFERENCES housekeepers(id) ON DELETE SET NULL,
  rating integer NOT NULL,
  content text,
  status varchar(24) NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_order_unique UNIQUE (service_order_id),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_status_check CHECK (status IN ('visible', 'hidden', 'pending_review'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  housekeeper_id uuid REFERENCES housekeepers(id) ON DELETE SET NULL,
  complaint_type varchar(40) NOT NULL,
  content text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'open',
  handled_by varchar(80),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT complaints_status_check CHECK (status IN ('open', 'investigating', 'resolved', 'closed'))
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  follow_up_type varchar(32) NOT NULL,
  result varchar(32) NOT NULL DEFAULT 'pending',
  content text,
  next_follow_up_at timestamptz,
  handled_by varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_type_check CHECK (follow_up_type IN ('pre_service', 'in_service', 'post_service', 'complaint')),
  CONSTRAINT follow_ups_result_check CHECK (result IN ('pending', 'completed', 'needs_action'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor varchar(80) NOT NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_housekeepers_status ON housekeepers(status);
CREATE INDEX IF NOT EXISTS idx_service_items_category_id ON service_items(category_id);
CREATE INDEX IF NOT EXISTS idx_service_addresses_customer_id ON service_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_service_item_id ON service_orders(service_item_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_manual_dispatches_order_id ON manual_dispatches(service_order_id);
CREATE INDEX IF NOT EXISTS idx_manual_dispatches_housekeeper_id ON manual_dispatches(housekeeper_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_order_id ON customer_communications(service_order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_housekeeper_id ON reviews(housekeeper_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_order_id ON follow_ups(service_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE OR REPLACE TRIGGER customers_set_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER housekeepers_set_updated_at
BEFORE UPDATE ON housekeepers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER service_categories_set_updated_at
BEFORE UPDATE ON service_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER service_items_set_updated_at
BEFORE UPDATE ON service_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER service_addresses_set_updated_at
BEFORE UPDATE ON service_addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER service_orders_set_updated_at
BEFORE UPDATE ON service_orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER manual_dispatches_set_updated_at
BEFORE UPDATE ON manual_dispatches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER customer_communications_set_updated_at
BEFORE UPDATE ON customer_communications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER reviews_set_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER complaints_set_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER follow_ups_set_updated_at
BEFORE UPDATE ON follow_ups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO service_categories (code, name, description, sort_order)
VALUES
  ('maternal_childcare', '母婴护理', '月嫂、育儿嫂等母婴相关服务', 10),
  ('home_care', '家庭保姆', '住家保姆、不住家保姆等家庭照护服务', 20),
  ('elderly_care', '养老护理', '居家老人照护和陪护服务', 30),
  ('cleaning', '保洁小时工', '日常保洁、深度保洁和小时工服务', 40)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order;

INSERT INTO service_items (category_id, code, name, unit, base_price_min, base_price_max)
SELECT c.id, item.code, item.name, item.unit, item.base_price_min, item.base_price_max
FROM (
  VALUES
    ('maternal_childcare', 'yuesao', '月嫂', 'month', 12000.00, 22000.00),
    ('maternal_childcare', 'yuer_sao', '育儿嫂', 'month', 9000.00, 16000.00),
    ('home_care', 'live_in_nanny', '住家保姆', 'month', 7500.00, 12000.00),
    ('cleaning', 'hourly_cleaning', '小时工保洁', 'hour', 60.00, 120.00)
) AS item(category_code, code, name, unit, base_price_min, base_price_max)
JOIN service_categories c ON c.code = item.category_code
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      unit = EXCLUDED.unit,
      base_price_min = EXCLUDED.base_price_min,
      base_price_max = EXCLUDED.base_price_max;

INSERT INTO customers (name, phone, source, notes)
VALUES
  ('测试客户赵女士', '13800000001', 'manual', '安全测试数据，不是真实客户。'),
  ('测试客户李先生', '13800000002', 'manual', '安全测试数据，不是真实客户。')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO housekeepers (name, phone, birth_year, hometown, experience_years, live_in_available, status, bio)
VALUES
  ('测试阿姨王女士', '13900000001', 1982, '河北保定', 8, true, 'approved', '安全测试数据，擅长育儿照护。'),
  ('测试阿姨刘女士', '13900000002', 1978, '河南安阳', 10, true, 'approved', '安全测试数据，擅长家庭保姆服务。')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO service_addresses (customer_id, contact_name, contact_phone, province, city, district, detail_address, is_default)
SELECT c.id, c.name, c.phone, '北京', '北京', '朝阳区', '望京测试小区 1 号楼', true
FROM customers c
WHERE c.phone = '13800000001'
  AND NOT EXISTS (
    SELECT 1 FROM service_addresses sa
    WHERE sa.customer_id = c.id
      AND sa.detail_address = '望京测试小区 1 号楼'
  )
ON CONFLICT DO NOTHING;

INSERT INTO service_orders (
  order_no,
  customer_id,
  service_item_id,
  service_address_id,
  requested_start_date,
  budget_min,
  budget_max,
  family_requirements,
  source,
  consultant_name,
  status
)
SELECT
  'YGTEST20260613001',
  c.id,
  si.id,
  sa.id,
  DATE '2026-06-20',
  9000.00,
  12000.00,
  '测试家庭需求：宝宝照护、辅食和早教陪伴。',
  'manual',
  '测试顾问',
  'matching'
FROM customers c
JOIN service_items si ON si.code = 'yuer_sao'
LEFT JOIN service_addresses sa ON sa.customer_id = c.id AND sa.is_default = true
WHERE c.phone = '13800000001'
ON CONFLICT (order_no) DO NOTHING;

INSERT INTO manual_dispatches (service_order_id, housekeeper_id, dispatch_status, assigned_by, notes)
SELECT o.id, h.id, 'proposed', '测试顾问', '测试派单记录。'
FROM service_orders o
JOIN housekeepers h ON h.phone = '13900000001'
WHERE o.order_no = 'YGTEST20260613001'
ON CONFLICT (service_order_id, housekeeper_id) DO NOTHING;

INSERT INTO order_status_history (service_order_id, from_status, to_status, changed_by, change_reason)
SELECT o.id, NULL, 'matching', 'system', '初始化测试订单状态。'
FROM service_orders o
WHERE o.order_no = 'YGTEST20260613001'
  AND NOT EXISTS (
    SELECT 1 FROM order_status_history h
    WHERE h.service_order_id = o.id AND h.to_status = 'matching'
  );

INSERT INTO customer_communications (customer_id, service_order_id, channel, direction, content, handled_by)
SELECT c.id, o.id, 'phone', 'outbound', '已确认服务时间和预算范围。', '测试顾问'
FROM customers c
JOIN service_orders o ON o.customer_id = c.id
WHERE o.order_no = 'YGTEST20260613001'
  AND NOT EXISTS (
    SELECT 1 FROM customer_communications cc
    WHERE cc.service_order_id = o.id
      AND cc.channel = 'phone'
      AND cc.content = '已确认服务时间和预算范围。'
  )
ON CONFLICT DO NOTHING;

INSERT INTO reviews (service_order_id, customer_id, housekeeper_id, rating, content, status)
SELECT o.id, c.id, h.id, 5, '测试评价：服务沟通顺畅。', 'visible'
FROM service_orders o
JOIN customers c ON c.id = o.customer_id
JOIN housekeepers h ON h.phone = '13900000001'
WHERE o.order_no = 'YGTEST20260613001'
ON CONFLICT (service_order_id) DO NOTHING;

INSERT INTO complaints (service_order_id, customer_id, housekeeper_id, complaint_type, content, status, handled_by)
SELECT o.id, c.id, h.id, 'service_feedback', '测试投诉记录，用于验证表结构。', 'resolved', '测试顾问'
FROM service_orders o
JOIN customers c ON c.id = o.customer_id
JOIN housekeepers h ON h.phone = '13900000001'
WHERE o.order_no = 'YGTEST20260613001'
  AND NOT EXISTS (
    SELECT 1 FROM complaints co
    WHERE co.service_order_id = o.id
      AND co.complaint_type = 'service_feedback'
      AND co.content = '测试投诉记录，用于验证表结构。'
  )
ON CONFLICT DO NOTHING;

INSERT INTO follow_ups (service_order_id, customer_id, follow_up_type, result, content, handled_by)
SELECT o.id, c.id, 'pre_service', 'completed', '测试回访：客户确认继续匹配。', '测试顾问'
FROM service_orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.order_no = 'YGTEST20260613001'
  AND NOT EXISTS (
    SELECT 1 FROM follow_ups fu
    WHERE fu.service_order_id = o.id
      AND fu.follow_up_type = 'pre_service'
      AND fu.content = '测试回访：客户确认继续匹配。'
  )
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (actor, action, entity_type, entity_id, after_data)
SELECT 'system', 'seed', 'service_orders', o.id, jsonb_build_object('order_no', o.order_no, 'status', o.status)
FROM service_orders o
WHERE o.order_no = 'YGTEST20260613001'
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a
    WHERE a.entity_type = 'service_orders'
      AND a.entity_id = o.id
      AND a.action = 'seed'
  );
