import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, PageHeader, Button, Input, Select, Badge } from '@/components/ui';
import { Palette, Key, Bell, Database, Download, Trash2, Check, Cpu } from 'lucide-react';

const WALLPAPERS = [
  { id: 'light', label: 'Light Default', preview: 'bg-zinc-100' },
  { id: 'warm', label: 'Warm Morning', preview: 'bg-gradient-to-br from-amber-50 to-orange-100' },
  { id: 'cool', label: 'Cool Breeze', preview: 'bg-gradient-to-br from-cyan-50 to-blue-100' },
  { id: 'forest', label: 'Forest Calm', preview: 'bg-gradient-to-br from-emerald-50 to-green-100' },
  { id: 'rose', label: 'Rose Petal', preview: 'bg-gradient-to-br from-rose-50 to-pink-100' },
  { id: 'slate', label: 'Slate Dark', preview: 'bg-gradient-to-br from-zinc-700 to-zinc-900' },
];

const ACCENT_COLORS = [
  { id: 'zinc', label: 'Graphite', hex: '#27272a' },
  { id: 'blue', label: 'Ocean Blue', hex: '#3b82f6' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
];

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini — Fast & affordable' },
  { value: 'gpt-4o', label: 'GPT-4o — Most capable' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet — Balanced' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku — Quick responses' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash — Google\'s fastest' },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B — Open source' },
];

export default function SettingsPage() {
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem('epicure-wallpaper') || 'light');
  const [accent, setAccent] = useState(() => localStorage.getItem('epicure-accent') || 'zinc');
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('epicure-openrouter-key') || '');
  const [mwKey, setMwKey] = useState(() => localStorage.getItem('epicure-mw-key') || '');
  const [defaultModel, setDefaultModel] = useState(() => localStorage.getItem('epicure-default-model') || 'gpt-4o-mini');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('epicure-notifications') === 'true');
  const [notifFocusComplete, setNotifFocusComplete] = useState(() => localStorage.getItem('epicure-notif-focus') === 'true');
  const [notifDeadlines, setNotifDeadlines] = useState(() => localStorage.getItem('epicure-notif-deadlines') === 'true');
  const [notifFlashcards, setNotifFlashcards] = useState(() => localStorage.getItem('epicure-notif-flashcards') === 'true');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Apply wallpaper to body
    const wp = WALLPAPERS.find((w) => w.id === wallpaper);
    if (wp && wallpaper !== 'light') {
      document.body.style.background = wp.preview.replace('bg-gradient-to-br ', '').replace('bg-', '');
    }
  }, [wallpaper]);

  const saveSettings = () => {
    localStorage.setItem('epicure-wallpaper', wallpaper);
    localStorage.setItem('epicure-accent', accent);
    localStorage.setItem('epicure-openrouter-key', openRouterKey);
    localStorage.setItem('epicure-mw-key', mwKey);
    localStorage.setItem('epicure-default-model', defaultModel);
    localStorage.setItem('epicure-notifications', String(notifEnabled));
    localStorage.setItem('epicure-notif-focus', String(notifFocusComplete));
    localStorage.setItem('epicure-notif-deadlines', String(notifDeadlines));
    localStorage.setItem('epicure-notif-flashcards', String(notifFlashcards));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = async () => {
    const tables = ['assessments', 'class_hub', 'class_hub_links', 'todos', 'kanban_tasks',
      'pomodoro_sessions', 'pomodoro_settings', 'habits', 'habit_completions',
      'finance_settings', 'finance_transactions', 'finance_goals', 'notes',
      'timetable_entries', 'class_attendance', 'flashcard_decks', 'flashcards',
      'todo_subtasks', 'forecast_scenarios', 'scratchpad'];
    const dump: Record<string, unknown> = {};
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*');
      dump[table] = data;
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epicure-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Customize your epicure experience"
        action={
          <Button onClick={saveSettings}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Settings'}
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-zinc-800">Appearance</h3>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-zinc-600 mb-2 block">Background / Wallpaper</label>
            <div className="grid grid-cols-3 gap-2">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => setWallpaper(wp.id)}
                  className={`p-2 rounded-xl border-2 transition-all ${wallpaper === wp.id ? 'border-zinc-800' : 'border-transparent'}`}
                >
                  <div className={`h-16 rounded-lg ${wp.preview} mb-1.5`} />
                  <p className="text-xs font-medium text-zinc-600">{wp.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-600 mb-2 block">Theme Accent Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAccent(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${accent === c.id ? 'border-zinc-800' : 'border-transparent glass'}`}
                >
                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span className="text-sm font-medium text-zinc-600">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* API Keys */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-zinc-800">API Keys</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-600 mb-1 block">OpenRouter API Key</label>
              <Input type="password" value={openRouterKey} onChange={setOpenRouterKey} placeholder="sk-or-v1-..." />
              <p className="text-xs text-zinc-400 mt-1">Used for the Study Assistant AI chat. Get a key at openrouter.ai</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-600 mb-1 block">Merriam-Webster Dictionary API Key</label>
              <Input type="password" value={mwKey} onChange={setMwKey} placeholder="Your MW Collegiate API key" />
              <p className="text-xs text-zinc-400 mt-1">Used by the dictionary widget for full lookup features</p>
            </div>
          </div>
        </Card>

        {/* AI Model */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-zinc-800">Study Assistant</h3>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-600 mb-1 block">Default AI Model</label>
            <Select value={defaultModel} onChange={setDefaultModel} options={AI_MODELS} />
            <p className="text-xs text-zinc-400 mt-1">Select which AI model to use when asking study questions</p>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-zinc-800">Notification Preferences</h3>
          </div>
          <div className="space-y-3">
            <ToggleRow
              label="Enable notifications"
              description="Master switch for all notifications"
              value={notifEnabled}
              onChange={setNotifEnabled}
            />
            <ToggleRow
              label="Focus session complete"
              description="Get notified when a Pomodoro session ends"
              value={notifFocusComplete}
              onChange={setNotifFocusComplete}
              disabled={!notifEnabled}
            />
            <ToggleRow
              label="Deadline reminders"
              description="Get reminded about upcoming deadlines"
              value={notifDeadlines}
              onChange={setNotifDeadlines}
              disabled={!notifEnabled}
            />
            <ToggleRow
              label="Flashcard review due"
              description="Get notified when flashcards are due for review"
              value={notifFlashcards}
              onChange={setNotifFlashcards}
              disabled={!notifEnabled}
            />
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-zinc-800">Data Management</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl glass">
              <div>
                <p className="text-sm font-medium text-zinc-700">Export / Backup Data</p>
                <p className="text-xs text-zinc-400">Download all your data as a JSON file</p>
              </div>
              <Button variant="secondary" size="sm" onClick={exportData}>
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl glass border border-red-100/50">
              <div>
                <p className="text-sm font-medium text-red-600">Clear Cache / Reset</p>
                <p className="text-xs text-zinc-400">Clear local settings and reload the app</p>
              </div>
              <Button variant="danger" size="sm" onClick={clearCache}>
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange, disabled }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl glass ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium text-zinc-700">{label}</p>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-zinc-900' : 'bg-zinc-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
