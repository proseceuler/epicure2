import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, PageHeader } from '@/components/ui';
import { StickyNote, Check } from 'lucide-react';

export default function ScratchpadPage() {
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordId = useRef<string | null>(null);

  const loadScratchpad = useCallback(async () => {
    const { data } = await supabase.from('scratchpad').select('*').maybeSingle();
    if (data) {
      setContent(data.content);
      recordId.current = data.id;
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadScratchpad(); }, [loadScratchpad]);

  const save = useCallback(async (text: string) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (recordId.current) {
        await supabase.from('scratchpad').update({ content: text, updated_at: new Date().toISOString() }).eq('id', recordId.current);
      } else {
        const { data } = await supabase.from('scratchpad').insert({ content: text }).select().single();
        if (data) recordId.current = data.id;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    save(text);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><StickyNote className="w-8 h-8 text-zinc-300 animate-pulse" /></div>;
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div>
      <PageHeader
        title="Quick Scratchpad"
        subtitle="Jot down ideas without leaving the page — auto-saves as you type"
        action={
          <div className="flex items-center gap-1.5 text-sm">
            {saved ? (
              <span className="flex items-center gap-1 text-zinc-700 font-medium">
                <Check className="w-4 h-4" /> Saved
              </span>
            ) : (
              <span className="text-zinc-400">Auto-saving...</span>
            )}
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <textarea
          value={content}
          onChange={handleChange}
          autoFocus
          placeholder="Start typing anything — ideas, reminders, formulas, quick notes..."
          className="w-full min-h-[60vh] p-6 text-sm text-zinc-800 placeholder-zinc-400 resize-none focus:outline-none leading-relaxed bg-transparent"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-200/40 text-xs text-zinc-400">
          <span>{wordCount} words · {charCount} characters</span>
          <span className="flex items-center gap-1">
            <StickyNote className="w-3 h-3" /> Auto-saved
          </span>
        </div>
      </Card>
    </div>
  );
}
