ALTER TABLE service_modules
  ADD COLUMN IF NOT EXISTS module_type varchar(32) NOT NULL DEFAULT 'highlight',
  ADD COLUMN IF NOT EXISTS icon_text varchar(20),
  ADD COLUMN IF NOT EXISTS icon_image text,
  ADD COLUMN IF NOT EXISTS theme varchar(40),
  ADD COLUMN IF NOT EXISTS target_type varchar(80),
  ADD COLUMN IF NOT EXISTS target_value text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_modules_module_type_check'
  ) THEN
    ALTER TABLE service_modules
      ADD CONSTRAINT service_modules_module_type_check
      CHECK (module_type IN ('highlight', 'service'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_modules_type_visible_sort
  ON service_modules(module_type, visible, sort);

UPDATE service_modules
SET module_type = 'highlight',
    icon_text = COALESCE(NULLIF(icon_text, ''), '区'),
    theme = COALESCE(NULLIF(theme, ''), 'green'),
    target_type = 'service',
    target_value = COALESCE(NULLIF(target_value, ''), 'all')
WHERE title = '服务范围';

UPDATE service_modules
SET module_type = 'highlight',
    icon_text = COALESCE(NULLIF(icon_text, ''), '配'),
    theme = COALESCE(NULLIF(theme, ''), 'mint'),
    target_type = 'demand',
    target_value = COALESCE(NULLIF(target_value, ''), 'new')
WHERE title = '推荐机制';

UPDATE service_modules
SET module_type = 'highlight',
    icon_text = COALESCE(NULLIF(icon_text, ''), '点'),
    theme = COALESCE(NULLIF(theme, ''), 'blue'),
    target_type = COALESCE(NULLIF(target_type, ''), 'store'),
    target_value = COALESCE(NULLIF(target_value, ''), 'all')
WHERE title = '重点区域';

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '育儿嫂', '0-3 岁婴幼儿照护', 'service', '育', 'mint', '找阿姨', '育儿嫂', 20, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '育儿嫂');

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '月嫂', '产妇和新生儿照护', 'service', '月', 'rose', '找阿姨', '月嫂', 30, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '月嫂');

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '住家保姆', '三餐家务和日常照护', 'service', '家', 'green', '找阿姨', '住家保姆', 40, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '住家保姆');

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '小时工', '保洁收纳和临时家务', 'service', '时', 'blue', '找阿姨', '小时工', 50, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '小时工');

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '老人陪护', '陪诊照护和生活协助', 'service', '护', 'warm', '找阿姨', '老人陪护', 60, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '老人陪护');

INSERT INTO service_modules (title, summary, module_type, icon_text, theme, target_type, target_value, sort, visible)
SELECT '家庭保洁', '家庭清洁和整理收纳', 'service', '洁', 'green', '找阿姨', '家庭保洁', 70, true
WHERE NOT EXISTS (SELECT 1 FROM service_modules WHERE title = '家庭保洁');
