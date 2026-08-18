/*
# Study App: Full Database Schema

Creates all tables for the personal grades & productivity study app.

## Tables Created

1. `assessments` — individual grade entries per subject, quarter, and component (WW/PT/EX with EX sub-types ST1/ST2/TE)
2. `class_hub` — per-subject teacher info, office hours, room, notes
3. `class_hub_links` — quick links to course materials per subject
4. `todos` — master to-do list with Eisenhower Matrix priority and subject tagging
5. `kanban_tasks` — project board tasks with status (todo/in_progress/review/done) and drag-and-drop ordering
6. `pomodoro_sessions` — completed focus/break sessions logged per subject
7. `pomodoro_settings` — per-user customizable timer durations
8. `habits` — daily habit definitions
9. `habit_completions` — per-day habit completion records
10. `scratchpad` — single auto-save notepad per user

## Security

- RLS enabled on every table.
- All tables are owner-scoped: each user can only CRUD their own rows.
- Owner columns default to `auth.uid()` so inserts work even when the client omits `user_id`.
- 4 separate policies per table (SELECT/INSERT/UPDATE/DELETE), scoped to `authenticated`.
*/

-- ============================================================
-- assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key text NOT NULL,
  quarter int NOT NULL DEFAULT 1 CHECK (quarter BETWEEN 1 AND 4),
  component text NOT NULL CHECK (component IN ('ww', 'pt', 'ex')),
  ex_type text CHECK (ex_type IN ('st1', 'st2', 'te')),
  name text NOT NULL DEFAULT '',
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE POLICY "insert_own_assessments" ON assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "delete_own_assessments" ON assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- class_hub
-- ============================================================
CREATE TABLE IF NOT EXISTS class_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key text NOT NULL UNIQUE,
  teacher_name text DEFAULT '',
  office_hours text DEFAULT '',
  room text DEFAULT '',
  notes text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE class_hub ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_class_hub" ON class_hub;
CREATE POLICY "select_own_class_hub" ON class_hub FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_class_hub" ON class_hub;
CREATE POLICY "insert_own_class_hub" ON class_hub FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_class_hub" ON class_hub;
CREATE POLICY "update_own_class_hub" ON class_hub FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_class_hub" ON class_hub;
CREATE POLICY "delete_own_class_hub" ON class_hub FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- class_hub_links
-- ============================================================
CREATE TABLE IF NOT EXISTS class_hub_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_hub_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_class_hub_links" ON class_hub_links;
CREATE POLICY "select_own_class_hub_links" ON class_hub_links FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_class_hub_links" ON class_hub_links;
CREATE POLICY "insert_own_class_hub_links" ON class_hub_links FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_class_hub_links" ON class_hub_links;
CREATE POLICY "update_own_class_hub_links" ON class_hub_links FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_class_hub_links" ON class_hub_links;
CREATE POLICY "delete_own_class_hub_links" ON class_hub_links FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- todos
-- ============================================================
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject_key text,
  due_date date,
  priority text NOT NULL DEFAULT 'not_urgent_important' CHECK (priority IN ('urgent_important', 'not_urgent_important', 'urgent_not_important', 'not_urgent_not_important')),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_todos" ON todos;
CREATE POLICY "select_own_todos" ON todos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_todos" ON todos;
CREATE POLICY "insert_own_todos" ON todos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_todos" ON todos;
CREATE POLICY "update_own_todos" ON todos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_todos" ON todos;
CREATE POLICY "delete_own_todos" ON todos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- kanban_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  subject_key text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  due_date date,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_kanban" ON kanban_tasks;
CREATE POLICY "select_own_kanban" ON kanban_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_kanban" ON kanban_tasks;
CREATE POLICY "insert_own_kanban" ON kanban_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_kanban" ON kanban_tasks;
CREATE POLICY "update_own_kanban" ON kanban_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_kanban" ON kanban_tasks;
CREATE POLICY "delete_own_kanban" ON kanban_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- pomodoro_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_key text,
  duration_minutes int NOT NULL DEFAULT 25,
  session_type text NOT NULL DEFAULT 'focus' CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pomodoro" ON pomodoro_sessions;
CREATE POLICY "select_own_pomodoro" ON pomodoro_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_pomodoro" ON pomodoro_sessions;
CREATE POLICY "insert_own_pomodoro" ON pomodoro_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_pomodoro" ON pomodoro_sessions;
CREATE POLICY "update_own_pomodoro" ON pomodoro_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_pomodoro" ON pomodoro_sessions;
CREATE POLICY "delete_own_pomodoro" ON pomodoro_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- pomodoro_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_duration int NOT NULL DEFAULT 25 CHECK (focus_duration BETWEEN 1 AND 120),
  short_break_duration int NOT NULL DEFAULT 5 CHECK (short_break_duration BETWEEN 1 AND 60),
  long_break_duration int NOT NULL DEFAULT 15 CHECK (long_break_duration BETWEEN 1 AND 60),
  sessions_before_long_break int NOT NULL DEFAULT 4 CHECK (sessions_before_long_break BETWEEN 1 AND 10),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "select_own_pomodoro_settings" ON pomodoro_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "insert_own_pomodoro_settings" ON pomodoro_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "update_own_pomodoro_settings" ON pomodoro_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_pomodoro_settings" ON pomodoro_settings;
CREATE POLICY "delete_own_pomodoro_settings" ON pomodoro_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- habits
-- ============================================================
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'emerald',
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- habit_completions
-- ============================================================
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (habit_id, completion_date)
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habit_completions" ON habit_completions;
CREATE POLICY "select_own_habit_completions" ON habit_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habit_completions" ON habit_completions;
CREATE POLICY "insert_own_habit_completions" ON habit_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habit_completions" ON habit_completions;
CREATE POLICY "update_own_habit_completions" ON habit_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habit_completions" ON habit_completions;
CREATE POLICY "delete_own_habit_completions" ON habit_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- scratchpad
-- ============================================================
CREATE TABLE IF NOT EXISTS scratchpad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE scratchpad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scratchpad" ON scratchpad;
CREATE POLICY "select_own_scratchpad" ON scratchpad FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_scratchpad" ON scratchpad;
CREATE POLICY "insert_own_scratchpad" ON scratchpad FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_scratchpad" ON scratchpad;
CREATE POLICY "update_own_scratchpad" ON scratchpad FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_scratchpad" ON scratchpad;
CREATE POLICY "delete_own_scratchpad" ON scratchpad FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assessments_user_subject_quarter ON assessments(user_id, subject_key, quarter);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_status ON kanban_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completion_date);
