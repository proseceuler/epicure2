import { useState, useRef, useEffect } from 'react';
import { BookOpen, GripHorizontal, X, Search } from 'lucide-react';

interface DictProps {
  detached: boolean;
  onDetach: () => void;
  onSnapBack: () => void;
  onClose: () => void;
}

interface DictEntry {
  word: string;
  phonetic: string;
  syllables: string;
  partOfSpeech: string;
  definitions: { text: string; synonyms: string[] }[];
}

export default function DictionaryWidget({ detached, onDetach, onSnapBack, onClose }: DictProps) {
  const [query, setQuery] = useState('');
  const [entry, setEntry] = useState<DictEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pos, setPos] = useState({ x: 60, y: 80 });
  const dragRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
    };
    const onUp = () => { dragRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    if (!detached) return;
    dragRef.current = true;
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const lookup = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setEntry(null);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        const d = data[0];
        const meaning = d.meanings?.[0];
        const defs: { text: string; synonyms: string[] }[] = [];
        if (meaning) {
          (meaning.definitions || []).slice(0, 5).forEach((def: { definition: string; synonyms?: string[] }) => {
            defs.push({
              text: def.definition,
              synonyms: def.synonyms || (meaning.synonyms || []).slice(0, 3),
            });
          });
        }
        const syllables = d.word.split('').join('·');
        setEntry({
          word: d.word,
          phonetic: d.phonetic || d.phonetics?.find((p: { text?: string }) => p.text)?.text || '',
          syllables,
          partOfSpeech: meaning?.partOfSpeech || '',
          definitions: defs,
        });
      } else {
        setError('No definition found.');
      }
    } catch {
      setError('Lookup failed. Check your connection.');
    }
    setLoading(false);
  };

  const containerClass = detached
    ? 'fixed z-[70] w-96'
    : 'w-full max-w-[380px] mx-auto';

  const style = detached ? { left: pos.x, top: pos.y } : undefined;

  return (
    <div className={containerClass} style={style}>
      <div className="glass glass-shadow-lg rounded-3xl overflow-hidden">
        {/* Title bar */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-b border-white/10 ${detached ? 'cursor-move' : ''}`}
          onMouseDown={onDragStart}
        >
          <div className="flex items-center gap-2">
            {detached && <GripHorizontal className="w-3.5 h-3.5 text-zinc-400" />}
            <BookOpen className="w-4 h-4 text-zinc-600" />
            <span className="text-xs font-medium text-zinc-700">Dictionary</span>
          </div>
          <div className="flex items-center gap-1">
            {detached ? (
              <button onClick={onSnapBack} className="w-6 h-6 rounded-lg hover:bg-zinc-200/50 flex items-center justify-center text-xs text-zinc-500" title="Snap to dock">
                ↓
              </button>
            ) : (
              <button onClick={onDetach} className="w-6 h-6 rounded-lg hover:bg-zinc-200/50 flex items-center justify-center text-xs text-zinc-500" title="Detach">
                ↑
              </button>
            )}
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-zinc-200/50 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-zinc-200/30">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
              placeholder="Look up a word..."
              className="flex-1 px-3 py-1.5 glass-input rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none"
              autoFocus
            />
            <button onClick={lookup} disabled={loading} className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" />
              {loading ? '...' : 'Go'}
            </button>
          </div>
        </div>

        {/* Result — classic print style */}
        <div className="max-h-[400px] overflow-y-auto">
          {error && (
            <div className="px-5 py-4 text-sm text-zinc-500 italic">{error}</div>
          )}
          {!entry && !error && !loading && (
            <div className="px-5 py-8 text-center text-sm text-zinc-400 italic">
              Enter a word to see its definition.
            </div>
          )}
          {loading && (
            <div className="px-5 py-8 text-center text-sm text-zinc-400">Looking up...</div>
          )}
          {entry && (
            <div className="px-5 py-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {/* Headword + phonetics */}
              <div className="border-b border-zinc-300/50 pb-2 mb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-zinc-900 lowercase">{entry.word}</span>
                  {entry.phonetic && (
                    <span className="text-sm text-zinc-500">/{entry.phonetic.replace(/\//g, '')}/</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">{entry.syllables}</div>
                {entry.partOfSpeech && (
                  <span className="italic text-sm text-zinc-600 mt-1 inline-block">{entry.partOfSpeech}.</span>
                )}
              </div>

              {/* Numbered definitions */}
              <ol className="space-y-3">
                {entry.definitions.map((def, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-zinc-700 tabular-nums shrink-0">{i + 1}.</span>
                      <div className="flex-1">
                        <span className="text-zinc-800">{def.text}</span>
                        {def.synonyms.length > 0 && (
                          <div className="mt-1 text-xs text-zinc-500">
                            <span className="font-semibold text-zinc-600">SYN:</span>{' '}
                            <span className="italic">{def.synonyms.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Usage note callout */}
              <div className="mt-4 p-3 rounded-lg bg-zinc-100/60 border border-zinc-200/40">
                <p className="text-xs text-zinc-500 italic">
                  Definitions provided by Free Dictionary API. For complete usage notes, etymology, and pronunciation audio, consult the full Merriam-Webster entry.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
