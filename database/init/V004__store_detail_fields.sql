ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS intro text,
  ADD COLUMN IF NOT EXISTS business_hours varchar(120),
  ADD COLUMN IF NOT EXISTS manager_name varchar(80),
  ADD COLUMN IF NOT EXISTS manager_title varchar(80),
  ADD COLUMN IF NOT EXISTS manager_image text,
  ADD COLUMN IF NOT EXISTS manager_intro text,
  ADD COLUMN IF NOT EXISTS staff_count integer,
  ADD COLUMN IF NOT EXISTS consultant_count integer,
  ADD COLUMN IF NOT EXISTS ayi_count integer,
  ADD COLUMN IF NOT EXISTS team_intro text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10, 6),
  ADD COLUMN IF NOT EXISTS longitude numeric(10, 6);

ALTER TABLE ayis
  ADD COLUMN IF NOT EXISTS store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_title varchar(80);

CREATE INDEX IF NOT EXISTS idx_ayis_store_id ON ayis(store_id);
CREATE INDEX IF NOT EXISTS idx_ayis_featured ON ayis(featured);

UPDATE stores
SET intro = '演示数据：东城安定门服务点面向东城、西城和朝阳家庭，提供家政、母婴、养老护理和住家服务咨询。',
    business_hours = '09:00-18:00',
    manager_name = '杨店长',
    manager_title = '门店负责人',
    manager_image = '',
    manager_intro = '演示数据：负责门店日常咨询、阿姨资料审核和客户服务跟进。',
    tags = ARRAY['家政','母婴','养老','保洁'],
    staff_count = 12,
    consultant_count = 4,
    ayi_count = 80,
    team_intro = '演示数据：团队由服务顾问、资料审核和客户跟进人员组成，重点服务东城及周边家庭。',
    latitude = 39.949000,
    longitude = 116.408000
WHERE id = 1;

UPDATE ayis
SET store_id = COALESCE(store_id, 1),
    featured = true,
    featured_title = '金牌育儿嫂'
WHERE id = 1;

INSERT INTO ayis (
  image, name, phone, source, age, hometown, service_type, experience,
  live_type, salary, available_time, skills, status, intro,
  store_id, featured, featured_title, visible
)
VALUES (
  '', '李阿姨', '13900000902', '后台录入', 48, '河南信阳', '住家保姆', 10,
  '住家', '7800-9800/月', '本周可上户',
  ARRAY['家庭餐','收纳整理','老人陪护'],
  '已认证',
  '演示数据：做饭好，收纳利落，适合长期住家服务。',
  1, true, '金牌住家保姆', true
)
ON CONFLICT (phone) DO UPDATE
SET image = EXCLUDED.image,
    name = EXCLUDED.name,
    source = EXCLUDED.source,
    age = EXCLUDED.age,
    hometown = EXCLUDED.hometown,
    service_type = EXCLUDED.service_type,
    experience = EXCLUDED.experience,
    live_type = EXCLUDED.live_type,
    salary = EXCLUDED.salary,
    available_time = EXCLUDED.available_time,
    skills = EXCLUDED.skills,
    intro = EXCLUDED.intro,
    store_id = EXCLUDED.store_id,
    featured = EXCLUDED.featured,
    featured_title = EXCLUDED.featured_title,
    status = EXCLUDED.status,
    visible = EXCLUDED.visible;

INSERT INTO ayis (
  image, name, phone, source, age, hometown, service_type, experience,
  live_type, salary, available_time, skills, status, intro,
  store_id, featured, featured_title, visible
)
VALUES (
  '', '张阿姨', '13900000903', '后台录入', 45, '山东临沂', '月嫂', 9,
  '住家', '15800-19800/月', '需提前预约',
  ARRAY['产妇护理','新生儿护理','月子餐'],
  '已认证',
  '演示数据：月子餐搭配细致，新生儿护理经验丰富。',
  1, true, '明星月嫂', true
)
ON CONFLICT (phone) DO UPDATE
SET image = EXCLUDED.image,
    name = EXCLUDED.name,
    source = EXCLUDED.source,
    age = EXCLUDED.age,
    hometown = EXCLUDED.hometown,
    service_type = EXCLUDED.service_type,
    experience = EXCLUDED.experience,
    live_type = EXCLUDED.live_type,
    salary = EXCLUDED.salary,
    available_time = EXCLUDED.available_time,
    skills = EXCLUDED.skills,
    intro = EXCLUDED.intro,
    store_id = EXCLUDED.store_id,
    featured = EXCLUDED.featured,
    featured_title = EXCLUDED.featured_title,
    status = EXCLUDED.status,
    visible = EXCLUDED.visible;
