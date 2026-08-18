import { useState, useRef, useCallback } from 'react';
import { Search, Volume2, BookOpen, Loader as Loader2, X } from 'lucide-react';

interface MWSense {
  dt: unknown[];
  sseq: unknown[];
  definition: string;
  partOfSpeech: string;
  usageNotes: string;
  etymology: string;
  verbalIllustrations: string[];
}

interface MWResult {
  meta: { id: string; uuid: string };
  hwi: { hw: string; prs?: { ipa?: string; sound?: { audio?: string } }[] };
  fl: string;
  def: { sseq: unknown[][] }[];
  shortdef: string[];
  et?: unknown[];
  ure?: string;
  ins?: { if: string }[];
  syns?: { pts: string[]; pl: string[] }[];
  ants?: { ptl: string[]; pl: string[] }[];
  dros?: { drp: string; def: { sseq: unknown[] }[] }[];
  uros?: { ure: string; fl: string }[];
  quotes?: string[];
  examples?: string[];
  date: string;
  app?: { appipas?: string[]; appshortdefs?: string[] };
}

interface DictEntry {
  word: string;
  partOfSpeech: string;
  pronunciation: string;
  audioUrl: string;
  definitions: string[];
  etymology: string;
  usageNotes: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  derivativelyRelated: { word: string; partOfSpeech: string }[];
}

function extractText(arr: unknown): string {
  if (!arr || !Array.isArray(arr)) return '';
  const result: string[] = [];
  const walk = (item: unknown) => {
    if (typeof item === 'string') result.push(item);
    else if (Array.isArray(item)) item.forEach(walk);
    else if (item && typeof item === 'object' && 'text' in item) {
      const text = (item as Record<string, unknown>).text;
      if (typeof text === 'string') result.push(text);
    }
  };
  arr.forEach(walk);
  return result.join(' ').replace(/\s+/g, ' ').trim();
}

function parseResult(raw: MWResult): DictEntry {
  const prs = raw.hwi?.prs?.[0];
  const ipa = prs?.ipa || '';
  const audioRef = prs?.sound?.audio || '';
  const audioUrl = audioRef
    ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioRef.charAt(0)}/${audioRef}.mp3`
    : '';

  const definitions = raw.shortdef || [];

  let etymology = '';
  if (raw.et && Array.isArray(raw.et)) {
    etymology = extractText(raw.et);
  }

  let usageNotes = '';
  if (raw.def?.[0]?.sseq) {
    const sseq = raw.def[0].sseq;
    for (const senseBlock of sseq) {
      if (Array.isArray(senseBlock)) {
        for (const sense of senseBlock) {
          if (Array.isArray(sense) && sense[1]) {
            const sn = (sense[1] as Record<string, unknown>);
            if ('sls' in sn) {
              usageNotes = extractText((sn as Record<string, unknown>).sls);
            }
            if ('dt' in sn) {
              const dt = (sn as Record<string, unknown>).dt as unknown[];
              if (Array.isArray(dt)) {
                for (const dtItem of dt) {
                  if (Array.isArray(dtItem) && dtItem[0] === 'vis') {
                    const vis = dtItem[1];
                    if (Array.isArray(vis)) {
                      return vis;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const synonyms: string[] = [];
  const antonyms: string[] = [];
  if (raw.syns) {
    for (const syn of raw.syns) {
      if (syn.pl) synonyms.push(...syn.pl);
    }
  }
  if (raw.ants) {
    for (const ant of raw.ants) {
      if (ant.pl) antonyms.push(...ant.pl);
    }
  }

  const examples: string[] = [];
  if (raw.def?.[0]?.sseq) {
    for (const sseq of raw.def[0].sseq) {
      if (Array.isArray(sseq)) {
        for (const sense of sseq) {
          if (Array.isArray(sense) && sense[1]) {
            const sn = sense[1] as Record<string, unknown>;
            if ('dt' in sn) {
              const dt = sn.dt as unknown[];
              if (Array.isArray(dt)) {
                for (const dtItem of dt) {
                  if (Array.isArray(dtItem) && dtItem[0] === 'vis') {
                    const vis = dtItem[1];
                    if (Array.isArray(vis)) {
                      for (const v of vis) {
                        const text = extractText([v]);
                        if (text) examples.push(text);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const derivativelyRelated = (raw.uros || []).map((u) => ({
    word: u.ure,
    partOfSpeech: u.fl || '',
  }));

  return {
    word: raw.hwi?.hw?.replace(/\*/g, '') || raw.meta?.id || '',
    partOfSpeech: raw.fl || '',
    pronunciation: ipa,
    audioUrl,
    definitions,
    etymology,
    usageNotes,
    synonyms: [...new Set(synonyms)].slice(0, 15),
    antonyms: [...new Set(antonyms)].slice(0, 10),
    examples: examples.slice(0, 5),
    derivativelyRelated,
  };
}

export default function DictionaryWidget({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setEntries([]);

    const apiKey = import.meta.env.VITE_MW_DICTIONARY_API_KEY;
    const word = encodeURIComponent(term.trim().toLowerCase());
    const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setError('No results found.');
        setLoading(false);
        return;
      }

      if (data.length > 0 && typeof data[0] === 'string') {
        setError(`No exact match. Suggestions: ${data.slice(0, 8).join(', ')}`);
        setLoading(false);
        return;
      }

      const parsed = (data as MWResult[])
        .filter((r) => r.meta && r.hwi)
        .map(parseResult)
        .filter((e) => e.definitions.length > 0);

      if (parsed.length === 0) {
        setError('No dictionary entries found for this word.');
      } else {
        setEntries(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch definition.');
    } finally {
      setLoading(false);
    }
  }, []);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search(query);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the dictionary..."
            className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-sm text-zinc-700"
            autoFocus
          />
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      )}

      {!loading && !error && entries.length === 0 && !searched && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-600">Merriam-Webster Dictionary</p>
          <p className="text-xs text-zinc-400 mt-0.5">Search for definitions, etymology, pronunciation, and more</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-4 overflow-y-auto flex-1">
          {entries.map((entry, idx) => (
            <div key={idx} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-zinc-800">{entry.word}</h3>
                    {entry.partOfSpeech && (
                      <span className="text-xs italic text-zinc-500">{entry.partOfSpeech}</span>
                    )}
                  </div>
                  {entry.pronunciation && (
                    <p className="text-sm text-zinc-500 mt-1">/{entry.pronunciation}/</p>
                  )}
                </div>
                {entry.audioUrl && (
                  <button
                    onClick={() => playAudio(entry.audioUrl)}
                    className="p-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Volume2 className="w-4 h-4" /> Listen
                  </button>
                )}
              </div>

              {entry.definitions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Definitions</p>
                  <ol className="space-y-1.5">
                    {entry.definitions.map((def, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-700">
                        <span className="font-medium text-zinc-400 shrink-0">{i + 1}.</span>
                        <span>{def}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {entry.usageNotes && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Usage</p>
                  <p className="text-sm text-zinc-600 italic">{entry.usageNotes}</p>
                </div>
              )}

              {entry.etymology && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Etymology</p>
                  <p className="text-sm text-zinc-600">{entry.etymology}</p>
                </div>
              )}

              {entry.examples.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Examples</p>
                  <ul className="space-y-1">
                    {entry.examples.map((ex, i) => (
                      <li key={i} className="text-sm text-zinc-600 italic border-l-2 border-zinc-200 pl-2.5">
                        "{ex}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {entry.synonyms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">Synonyms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.synonyms.map((syn, i) => (
                        <button
                          key={i}
                          onClick={() => { setQuery(syn); search(syn); }}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs hover:bg-emerald-100 transition-colors"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {entry.antonyms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Antonyms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.antonyms.map((ant, i) => (
                        <button
                          key={i}
                          onClick={() => { setQuery(ant); search(ant); }}
                          className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs hover:bg-red-100 transition-colors"
                        >
                          {ant}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {entry.derivativelyRelated.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Related Words</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.derivativelyRelated.map((rel, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-xs">
                        {rel.word} {rel.partOfSpeech && <span className="italic opacity-60">{rel.partOfSpeech}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
