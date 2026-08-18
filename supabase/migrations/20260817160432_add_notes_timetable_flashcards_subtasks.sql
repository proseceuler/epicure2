-- Notes system
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  folder text NOT NULL DEFAULT 'General',
  tags text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  linked_subject text,
  linked_deadline_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_notes" ON notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_notes" ON notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_notes" ON notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_notes" ON notes FOR DELETE TO anon, authenticated USING (true);

-- Class timetable
CREATE TABLE IF NOT EXISTS timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_key text NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  room text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_timetable" ON timetable_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_timetable" ON timetable_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_timetable" ON timetable_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_timetable" ON timetable_entries FOR DELETE TO anon, authenticated USING (true);

-- Class attendance log
CREATE TABLE IF NOT EXISTS class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id uuid NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  class_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'skipped')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (timetable_entry_id, class_date)
);

ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_attendance" ON class_attendance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_attendance" ON class_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_attendance" ON class_attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_attendance" ON class_attendance FOR DELETE TO anon, authenticated USING (true);

-- Flashcard decks
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_key text,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_decks" ON flashcard_decks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_decks" ON flashcard_decks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_decks" ON flashcard_decks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_decks" ON flashcard_decks FOR DELETE TO anon, authenticated USING (true);

-- Flashcards with spaced repetition (SM-2 algorithm fields)
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  interval_days int NOT NULL DEFAULT 1,
  ease_factor real NOT NULL DEFAULT 2.5,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_flashcards" ON flashcards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_flashcards" ON flashcards FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_flashcards" ON flashcards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_flashcards" ON flashcards FOR DELETE TO anon, authenticated USING (true);

-- Todo subtasks
CREATE TABLE IF NOT EXISTS todo_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id uuid NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  estimated_minutes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todo_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_subtasks" ON todo_subtasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_subtasks" ON todo_subtasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_subtasks" ON todo_subtasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_subtasks" ON todo_subtasks FOR DELETE TO anon, authenticated USING (true);

-- Recurring expenses flag
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_date);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_entries(day_of_week);
