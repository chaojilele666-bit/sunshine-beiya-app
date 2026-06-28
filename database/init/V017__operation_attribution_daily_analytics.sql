SET client_encoding = 'UTF8';

ALTER TABLE ayis
  ADD COLUMN IF NOT EXISTS created_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_owner_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_store_id integer REFERENCES stores(id) ON DELETE SET NULL;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS created_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_owner_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL;

ALTER TABLE demands
  ADD COLUMN IF NOT EXISTS created_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_owner_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS created_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_owner_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL;

ALTER TABLE demand_follow_ups
  ADD COLUMN IF NOT EXISTS source_store_id integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_store_id_snapshot integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_organization_snapshot varchar(80);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_account_id integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_name_snapshot varchar(120),
  ADD COLUMN IF NOT EXISTS actor_role_snapshot varchar(40),
  ADD COLUMN IF NOT EXISTS actor_store_id_snapshot integer REFERENCES stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_organization_snapshot varchar(80),
  ADD COLUMN IF NOT EXISTS action_type varchar(80),
  ADD COLUMN IF NOT EXISTS resource_id_text_v2 text,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz NOT NULL DEFAULT now();

UPDATE audit_logs
SET action_type = COALESCE(action_type, action),
    actor_name_snapshot = COALESCE(actor_name_snapshot, actor),
    actor_role_snapshot = COALESCE(actor_role_snapshot, actor_role),
    occurred_at = COALESCE(occurred_at, created_at, now())
WHERE action_type IS NULL
   OR actor_name_snapshot IS NULL
   OR occurred_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ayis_source_store_id ON ayis(source_store_id);
CREATE INDEX IF NOT EXISTS idx_ayis_current_store_id ON ayis(current_store_id);
CREATE INDEX IF NOT EXISTS idx_demands_source_store_id ON demands(source_store_id);
CREATE INDEX IF NOT EXISTS idx_demands_current_store_id ON demands(current_store_id);
CREATE INDEX IF NOT EXISTS idx_customers_source_store_id ON customers(source_store_id);
CREATE INDEX IF NOT EXISTS idx_appointments_source_store_id ON appointments(source_store_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type_occurred_at ON audit_logs(action_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_account_occurred_at ON audit_logs(actor_account_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_store_occurred_at ON audit_logs(actor_store_id_snapshot, occurred_at);
