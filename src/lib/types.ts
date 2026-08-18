export type SubjectKey =
  | 'math' | 'science' | 'ap' | 'research'
  | 'filipino' | 'english' | 'values' | 'mapeh';

export type ComponentType = 'ww' | 'pt' | 'ex';
export type ExType = 'st1' | 'st2' | 'te';

export interface Subject {
  key: SubjectKey;
  name: string;
  shortName: string;
  color: string;
}

export const SUBJECTS: Subject[] = [
  { key: 'math', name: 'Mathematics', shortName: 'Math', color: '#3b82f6' },
  { key: 'science', name: 'Science', shortName: 'Sci', color: '#10b981' },
  { key: 'ap', name: 'Araling Panlipunan', shortName: 'AP', color: '#f59e0b' },
  { key: 'research', name: 'Research', shortName: 'Res', color: '#8b5cf6' },
  { key: 'filipino', name: 'Filipino', shortName: 'Fil', color: '#ef4444' },
  { key: 'english', name: 'English', shortName: 'Eng', color: '#06b6d4' },
  { key: 'values', name: 'Values Education', shortName: 'ValEd', color: '#ec4899' },
  { key: 'mapeh', name: 'MAPEH', shortName: 'MAPEH', color: '#f97316' },
];

export const NUM_TERMS = 3;

export const COMPONENT_WEIGHTS: Record<ComponentType, number> = {
  ww: 0.3,
  pt: 0.3,
  ex: 0.4,
};

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  ww: 'Written Work',
  pt: 'Performance Task',
  ex: 'Examination',
};

export const EX_TYPES: { key: ExType; label: string }[] = [
  { key: 'st1', label: 'Summative Test 1' },
  { key: 'st2', label: 'Summative Test 2' },
  { key: 'te', label: 'Term Exam' },
];

export interface Assessment {
  id: string;
  subject_key: SubjectKey;
  quarter: number;
  component: ComponentType;
  ex_type: ExType | null;
  name: string;
  score: number;
  max_score: number;
  created_at: string;
}

export interface ClassHub {
  id: string;
  subject_key: SubjectKey;
  teacher_name: string;
  office_hours: string;
  room: string;
  notes: string;
  updated_at: string;
}

export interface ClassHubLink {
  id: string;
  subject_key: SubjectKey;
  title: string;
  url: string;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  subject_key: SubjectKey | null;
  due_date: string | null;
  priority: 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important';
  completed: boolean;
  created_at: string;
}

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  subject_key: SubjectKey | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  subject_key: SubjectKey | null;
  duration_minutes: number;
  session_type: 'focus' | 'short_break' | 'long_break';
  rating: number | null;
  linked_todo_id: string | null;
  completed_at: string;
}

export interface PomodoroSettings {
  id: string;
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
  ambient_volume: number;
  ambient_type: 'rain' | 'white' | 'lofi';
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  goal_target: number;
  emoji: string;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completion_date: string;
}

export type ExpenseCategory = 'transportation' | 'food' | 'academics' | 'leisure';

export interface FinanceSettings {
  id: string;
  allowance_amount: number;
  allowance_period: 'weekly' | 'monthly';
  period_start_date: string;
  school_days_per_week: number;
}

export interface FinanceTransaction {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  transaction_date: string;
  is_recurring: boolean;
  is_income: boolean;
}

export interface FinanceGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
}

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'transportation', label: 'Transportation', emoji: '🚲' },
  { key: 'food', label: 'Food & Canteen', emoji: '🍚' },
  { key: 'academics', label: 'Academics & Projects', emoji: '📎' },
  { key: 'leisure', label: 'Wants / Leisure', emoji: '🎮' },
];

export interface WellnessLog {
  id: string;
  log_date: string;
  mood: number | null;
  sleep_hours: number | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  pinned: boolean;
  linked_subject: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntry {
  id: string;
  subject_key: SubjectKey;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}

export interface ClassAttendance {
  id: string;
  timetable_entry_id: string;
  class_date: string;
  status: 'pending' | 'attended' | 'skipped';
}

export interface FlashcardDeck {
  id: string;
  subject_key: SubjectKey | null;
  name: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  interval_days: number;
  ease_factor: number;
  due_date: string;
  review_count: number;
}

export interface TodoSubtask {
  id: string;
  todo_id: string;
  title: string;
  completed: boolean;
  estimated_minutes: number;
}

export interface ForecastScenario {
  id: string;
  name: string;
  subject_key: SubjectKey;
  quarter: number;
  target_grade: number;
  scenario_data: Record<string, unknown>;
  created_at: string;
}
