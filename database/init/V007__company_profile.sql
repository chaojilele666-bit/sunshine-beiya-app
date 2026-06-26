SET client_encoding = 'UTF8';

CREATE TABLE IF NOT EXISTS company_profile (
  id smallint PRIMARY KEY DEFAULT 1,
  company_name varchar(160) NOT NULL DEFAULT '北京阳光北亚家政',
  short_name varchar(80) NOT NULL DEFAULT '阳光北亚',
  introduction text NOT NULL DEFAULT '北京阳光北亚家政提供家政、母婴、养老护理和保洁等家庭服务咨询与匹配。',
  customer_service_phone varchar(40) NOT NULL DEFAULT '18611607087',
  address text NOT NULL DEFAULT '北京市东城区安定门外东河沿乙六号楼三层',
  business_hours varchar(120) NOT NULL DEFAULT '09:00-18:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_profile_single_row CHECK (id = 1)
);

INSERT INTO company_profile (
  id,
  company_name,
  short_name,
  introduction,
  customer_service_phone,
  address,
  business_hours
)
VALUES (
  1,
  '北京阳光北亚家政',
  '阳光北亚',
  '北京阳光北亚家政提供家政、母婴、养老护理和保洁等家庭服务咨询与匹配。',
  '18611607087',
  '北京市东城区安定门外东河沿乙六号楼三层',
  '09:00-18:00'
)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS company_profile_set_updated_at ON company_profile;
CREATE TRIGGER company_profile_set_updated_at
BEFORE UPDATE ON company_profile
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
