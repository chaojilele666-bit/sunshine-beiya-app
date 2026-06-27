SET client_encoding = 'UTF8';

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS demand_id integer REFERENCES demands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ayi_id integer REFERENCES ayis(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interview_method varchar(40),
  ADD COLUMN IF NOT EXISTS interview_result text,
  ADD COLUMN IF NOT EXISTS next_step text,
  ADD COLUMN IF NOT EXISTS status_updated_by integer REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_demand_id ON appointments(demand_id);
CREATE INDEX IF NOT EXISTS idx_appointments_ayi_id ON appointments(ayi_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status_created ON appointments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status_updated_at ON appointments(status_updated_at);
