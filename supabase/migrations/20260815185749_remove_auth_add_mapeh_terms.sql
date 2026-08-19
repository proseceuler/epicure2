-- Remove auth: change all RLS policies from authenticated to anon,authenticated
-- Change to no-auth: allow anon role full access (personal app, single user)

-- Drop all existing policies and recreate with anon,authenticated + USING(true)

-- assessments
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_quarter_check;
ALTER TABLE assessments ADD CONSTRAINT assessments_quarter_check CHECK (quarter BETWEEN 1 AND 3);
ALTER TABLE assessments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE assessments ALTER COLUMN user_id SET DEFAULT NULL;

DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "select_assessments" ON assessments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_assessments" ON assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_assessments" ON assessments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_assessments" ON assessments FOR DELETE TO anon, authenticated USING (true);

-- class_hub
ALTER TABLE class_hub ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE class_hub ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_class_hub" ON class_hub;
DROP POLICY IF EXISTS "insert_own_class_hub" ON class_hub;
DROP POLICY IF EXISTS "update_own_class_hub" ON class_hub;
DROP POLICY IF EXISTS "delete_own_class_hub" ON class_hub;
CREATE POLICY "select_class_hub" ON class_hub FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_class_hub" ON class_hub FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_class_hub" ON class_hub FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_class_hub" ON class_hub FOR DELETE TO anon, authenticated USING (true);

-- class_hub_links
ALTER TABLE class_hub_links ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE class_hub_links ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_class_hub_links" ON class_hub_links;
DROP POLICY IF EXISTS "insert_own_class_hub_links" ON class_hub_links;
DROP POLICY IF EXISTS "update_own_class_hub_links" ON class_hub_links;
DROP POLICY IF EXISTS "delete_own_class_hub_links" ON class_hub_links;
CREATE POLICY "select_class_hub_links" ON class_hub_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_class_hub_links" ON class_hub_links FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_class_hub_links" ON class_hub_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_class_hub_links" ON class_hub_links FOR DELETE TO anon, authenticated USING (true);

-- todos
ALTER TABLE todos ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE todos ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_todos" ON todos;
DROP POLICY IF EXISTS "insert_own_todos" ON todos;
DROP POLICY IF EXISTS "update_own_todos" ON todos;
DROP POLICY IF EXISTS "delete_own_todos" ON todos;
CREATE POLICY "select_todos" ON todos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_todos" ON todos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_todos" ON todos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_todos" ON todos FOR DELETE TO anon, authenticated USING (true);

-- kanban_tasks
ALTER TABLE kanban_tasks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE kanban_tasks ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_kanban" ON kanban_tasks;
DROP POLICY IF EXISTS "insert_own_kanban" ON kanban_tasks;
DROP POLICY IF EXISTS "update_own_kanban" ON kanban_tasks;
DROP POLICY IF EXISTS "delete_own_kanban" ON kanban_tasks;
CREATE POLICY "select_kanban" ON kanban_tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_kanban" ON kanban_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_kanban" ON kanban_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_kanban" ON kanban_tasks FOR DELETE TO anon, authenticated USING (true);

-- pomodoro_sessions
ALTER TABLE pomodoro_sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE pomodoro_sessions ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_pomodoro" ON pomodoro_sessions;
DROP POLICY IF EXISTS "insert_own_pomodoro" ON pomodoro_sessions;
DROP POLICY IF EXISTS "update_own_pomodoro" ON pomodoro_sessions;
DROP POLICY IF EXISTS "delete_own_pomodoro" ON pomodoro_sessions;
CREATE POLICY "select_pomodoro" ON pomodoro_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_pomodoro" ON pomodoro_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_pomodoro" ON pomodoro_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_pomodoro" ON pomodoro_sessions FOR DELETE TO anon, authenticated USING (true);

-- pomodoro_settings
ALTER TABLE pomodoro_settings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE pomodoro_settings ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_pomodoro_settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "insert_own_pomodoro_settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "update_own_pomodoro_settings" ON pomodoro_settings;
DROP POLICY IF EXISTS "delete_own_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "select_pomodoro_settings" ON pomodoro_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_pomodoro_settings" ON pomodoro_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_pomodoro_settings" ON pomodoro_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_pomodoro_settings" ON pomodoro_settings FOR DELETE TO anon, authenticated USING (true);

-- habits
ALTER TABLE habits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE habits ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_habits" ON habits;
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
DROP POLICY IF EXISTS "update_own_habits" ON habits;
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "select_habits" ON habits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_habits" ON habits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_habits" ON habits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_habits" ON habits FOR DELETE TO anon, authenticated USING (true);

-- habit_completions
ALTER TABLE habit_completions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE habit_completions ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "insert_own_habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "update_own_habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "delete_own_habit_completions" ON habit_completions;
CREATE POLICY "select_habit_completions" ON habit_completions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_habit_completions" ON habit_completions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_habit_completions" ON habit_completions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_habit_completions" ON habit_completions FOR DELETE TO anon, authenticated USING (true);

-- scratchpad
ALTER TABLE scratchpad ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE scratchpad ALTER COLUMN user_id SET DEFAULT NULL;
DROP POLICY IF EXISTS "select_own_scratchpad" ON scratchpad;
DROP POLICY IF EXISTS "insert_own_scratchpad" ON scratchpad;
DROP POLICY IF EXISTS "update_own_scratchpad" ON scratchpad;
DROP POLICY IF EXISTS "delete_own_scratchpad" ON scratchpad;
CREATE POLICY "select_scratchpad" ON scratchpad FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_scratchpad" ON scratchpad FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_scratchpad" ON scratchpad FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_scratchpad" ON scratchpad FOR DELETE TO anon, authenticated USING (true);
