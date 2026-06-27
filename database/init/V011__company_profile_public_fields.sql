SET client_encoding = 'UTF8';

ALTER TABLE company_profile
  ADD COLUMN IF NOT EXISTS company_logo text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_city varchar(80) NOT NULL DEFAULT '';
