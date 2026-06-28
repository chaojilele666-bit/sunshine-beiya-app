SET client_encoding = 'UTF8';

ALTER TABLE user_accounts
  DROP CONSTRAINT IF EXISTS user_accounts_role_check;

ALTER TABLE user_accounts
  ADD CONSTRAINT user_accounts_role_check
  CHECK (role IN ('customer', 'ayi', 'operator', 'boss', 'management', 'store_manager', 'store_staff'));

CREATE TABLE IF NOT EXISTS account_store_scopes (
  account_id integer NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  store_id integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_by integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_account_store_scopes_store_id
  ON account_store_scopes(store_id);

CREATE INDEX IF NOT EXISTS idx_account_store_scopes_created_by
  ON account_store_scopes(created_by);
