SET client_encoding = 'UTF8';

ALTER TABLE service_modules
  DROP CONSTRAINT IF EXISTS service_modules_module_type_check;

ALTER TABLE service_modules
  ADD CONSTRAINT service_modules_module_type_check
  CHECK (module_type IN ('highlight', 'service', 'shortcut'));

INSERT INTO service_modules (title, summary, module_type, icon_text, icon_image, theme, target_type, target_value, sort, visible)
SELECT '找阿姨', '查看认证档案', 'shortcut', '找', '', 'green', 'find_ayi', '', 5, true
WHERE NOT EXISTS (
  SELECT 1 FROM service_modules WHERE module_type = 'shortcut' AND title = '找阿姨'
);

INSERT INTO service_modules (title, summary, module_type, icon_text, icon_image, theme, target_type, target_value, sort, visible)
SELECT '发布需求', '顾问快速匹配', 'shortcut', '需', '', 'mint', 'demand', '', 10, true
WHERE NOT EXISTS (
  SELECT 1 FROM service_modules WHERE module_type = 'shortcut' AND title = '发布需求'
);

INSERT INTO service_modules (title, summary, module_type, icon_text, icon_image, theme, target_type, target_value, sort, visible)
SELECT '客服咨询', '电话沟通需求', 'shortcut', '客', '', 'blue', 'customer_service', '', 15, true
WHERE NOT EXISTS (
  SELECT 1 FROM service_modules WHERE module_type = 'shortcut' AND title = '客服咨询'
);

INSERT INTO service_modules (title, summary, module_type, icon_text, icon_image, theme, target_type, target_value, sort, visible)
SELECT '公司介绍', '了解流程与保障', 'shortcut', '介', '', 'warm', 'about', '', 20, true
WHERE NOT EXISTS (
  SELECT 1 FROM service_modules WHERE module_type = 'shortcut' AND title = '公司介绍'
);
