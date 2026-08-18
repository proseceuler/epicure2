-- Finance tables for student allowance tracker
CREATE TABLE IF NOT EXISTS finance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allowance_amount numeric NOT NULL DEFAULT 0,
  allowance_period text NOT NULL DEFAULT 'weekly' CHECK (allowance_period IN ('weekly', 'monthly')),
  period_start_date date NOT NULL DEFAULT CURRENT_DATE,
  school_days_per_week int NOT NULL DEFAULT 5,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_finance_settings" ON finance_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_finance_settings" ON finance_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_finance_settings" ON finance_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_finance_settings" ON finance_settings FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('transportation', 'food', 'academics', 'leisure')),
  amount numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_finance_transactions" ON finance_transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_finance_transactions" ON finance_transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_finance_transactions" ON finance_transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_finance_transactions" ON finance_transactions FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS finance_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  saved_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE finance_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_finance_goals" ON finance_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_finance_goals" ON finance_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_finance_goals" ON finance_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_finance_goals" ON finance_goals FOR DELETE TO anon, authenticated USING (true);

-- Advanced habits: add goal_target column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_target int NOT NULL DEFAULT 30;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT '✅';

-- Wellness tracking (mood + sleep per day)
CREATE TABLE IF NOT EXISTS wellness_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL UNIQUE,
  mood int CHECK (mood BETWEEN 1 AND 10),
  sleep_hours numeric CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wellness_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_wellness_log" ON wellness_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_wellness_log" ON wellness_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_wellness_log" ON wellness_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_wellness_log" ON wellness_log FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_wellness_log_date ON wellness_log(log_date);
