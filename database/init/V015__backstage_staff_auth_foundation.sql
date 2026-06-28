SET client_encoding = 'UTF8';

ALTER TABLE backstage_accounts
  ADD COLUMN IF NOT EXISTS store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_type varchar(40) NOT NULL DEFAULT 'backstage',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_status varchar(24) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS failed_login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_ip inet,
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by integer REFERENCES user_accounts(id) ON DELETE SET NULL;

ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_ip inet,
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;

ALTER TABLE auth_sessions
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;

UPDATE backstage_accounts
SET account_status = CASE
    WHEN status IN ('disabled', 'locked') THEN status
    WHEN status IN ('停用', '鍋滅敤') THEN 'disabled'
    ELSE 'active'
  END
WHERE account_status IS NULL OR account_status NOT IN ('active', 'disabled', 'locked');

UPDATE backstage_accounts
SET organization_type = 'backstage'
WHERE organization_type IS NULL OR organization_type = '';

UPDATE backstage_accounts
SET session_version = 1
WHERE session_version IS NULL OR session_version < 1;

UPDATE user_accounts
SET session_version = 1
WHERE session_version IS NULL OR session_version < 1;

UPDATE auth_sessions s
SET session_version = u.session_version
FROM user_accounts u
WHERE s.user_account_id = u.id
  AND (s.session_version IS NULL OR s.session_version < 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_backstage_accounts_phone_unique
  ON backstage_accounts(phone)
  WHERE phone IS NOT NULL AND phone <> '';

CREATE INDEX IF NOT EXISTS idx_backstage_accounts_store_id
  ON backstage_accounts(store_id);

CREATE INDEX IF NOT EXISTS idx_backstage_accounts_account_status
  ON backstage_accounts(account_status);

CREATE INDEX IF NOT EXISTS idx_user_accounts_session_version
  ON user_accounts(id, session_version);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_session_version
  ON auth_sessions(user_account_id, session_version)
  WHERE revoked_at IS NULL;
