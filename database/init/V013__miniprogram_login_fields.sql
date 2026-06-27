SET client_encoding = 'UTF8';

ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS registered_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login_method varchar(40),
  ADD COLUMN IF NOT EXISTS login_source varchar(80),
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wechat_bound_at timestamptz;

UPDATE user_accounts
SET registered_at = COALESCE(registered_at, created_at, now())
WHERE registered_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_wechat_openid_unique
  ON user_accounts(wechat_openid)
  WHERE wechat_openid IS NOT NULL AND wechat_openid <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_wechat_unionid_unique
  ON user_accounts(wechat_unionid)
  WHERE wechat_unionid IS NOT NULL AND wechat_unionid <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_accounts_verified_phone_unique
  ON user_accounts(phone)
  WHERE phone IS NOT NULL AND phone <> '' AND phone_verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_accounts_registered_at
  ON user_accounts(registered_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_accounts_last_login_at
  ON user_accounts(last_login_at DESC);
