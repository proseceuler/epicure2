import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, type ClassHub, type ClassHubLink, type SubjectKey } from '@/lib/types';
import { Card, PageHeader, Button, Input, EmptyState } from '@/components/ui';
import { FolderTree, Plus, Trash2, Link2, Clock, MapPin, User, Save, ExternalLink } from 'lucide-react';

export default function ClassHubPage() {
  const [hubs, setHubs] = useState<Record<string, ClassHub>>({});
  const [links, setLinks] = useState<ClassHubLink[]>([]);
  const [selected, setSelected] = useState<SubjectKey>('math');
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ teacher_name: '', office_hours: '', room: '', notes: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [{ data: hubData }, { data: linkData }] = await Promise.all([
      supabase.from('class_hub').select('*'),
      supabase.from('class_hub_links').select('*').order('created_at', { ascending: true }),
    ]);
    if (hubData) {
      const map: Record<string, ClassHub> = {};
      (hubData as ClassHub[]).forEach((h) => { map[h.subject_key] = h; });
      setHubs(map);
    }
    if (linkData) setLinks(linkData as ClassHubLink[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const hub = hubs[selected];
    setEditForm({
      teacher_name: hub?.teacher_name ?? '',
      office_hours: hub?.office_hours ?? '',
      room: hub?.room ?? '',
      notes: hub?.notes ?? '',
    });
  }, [selected, hubs]);

  const subject = SUBJECTS.find((s) => s.key === selected)!;
  const subjectLinks = links.filter((l) => l.subject_key === selected);

  const saveHub = async () => {
    setSaving(true);
    const existing = hubs[selected];
    if (existing) {
      const { data } = await supabase
        .from('class_hub')
        .update({ ...editForm, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) setHubs({ ...hubs, [selected]: data as ClassHub });
    } else {
      const { data } = await supabase
        .from('class_hub')
        .insert({ subject_key: selected, ...editForm })
        .select()
        .single();
      if (data) setHubs({ ...hubs, [selected]: data as ClassHub });
    }
    setSaving(false);
  };

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    const { data } = await supabase
      .from('class_hub_links')
      .insert({ subject_key: selected, title: newLink.title.trim(), url: newLink.url.trim() })
      .select()
      .single();
    if (data) {
      setLinks([...links, data as ClassHubLink]);
      setNewLink({ title: '', url: '' });
    }
  };

  const deleteLink = async (id: string) => {
    await supabase.from('class_hub_links').delete().eq('id', id);
    setLinks(links.filter((l) => l.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><FolderTree className="w-8 h-8 text-zinc-300 animate-pulse" /></div>;
  }

  return (
    <div>
      <PageHeader title="Class Hub" subtitle="Teacher info, office hours, and quick links for each subject" />

      <div className="flex flex-wrap gap-2 mb-6">
        {SUBJECTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSelected(s.key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              selected === s.key ? 'bg-zinc-900 text-white border-zinc-900' : 'glass text-zinc-600 border-transparent glass-hover'
            }`}
          >
            {s.shortName}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-zinc-800">{subject.name} · Class Info</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1">
                <User className="w-3.5 h-3.5" /> Teacher Name
              </label>
              <Input value={editForm.teacher_name} onChange={(v) => setEditForm({ ...editForm, teacher_name: v })} placeholder="e.g. Mrs. Reyes" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1">
                <Clock className="w-3.5 h-3.5" /> Office Hours
              </label>
              <Input value={editForm.office_hours} onChange={(v) => setEditForm({ ...editForm, office_hours: v })} placeholder="e.g. Mon-Fri 2-3pm" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Room
              </label>
              <Input value={editForm.room} onChange={(v) => setEditForm({ ...editForm, room: v })} placeholder="e.g. Room 204" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Any extra notes about this class..."
                className="w-full px-3 py-2 glass-input rounded-xl text-sm text-zinc-800 placeholder-zinc-400 resize-none"
              />
            </div>
            <Button onClick={saveHub} disabled={saving} className="w-full">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Class Info'}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-zinc-700" />
            </div>
            <h3 className="font-semibold text-zinc-800">Quick Links</h3>
          </div>

          <div className="flex gap-2 mb-4">
            <Input value={newLink.title} onChange={(v) => setNewLink({ ...newLink, title: v })} placeholder="Link title" className="flex-1" />
            <Input value={newLink.url} onChange={(v) => setNewLink({ ...newLink, url: v })} placeholder="https://..." className="flex-1" />
            <Button onClick={addLink} size="sm"><Plus className="w-3.5 h-3.5" /></Button>
          </div>

          {subjectLinks.length === 0 ? (
            <EmptyState icon={Link2} title="No links yet" subtitle="Add links to course materials, Google Classroom, etc." />
          ) : (
            <div className="space-y-2">
              {subjectLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-white/40 transition-colors">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {link.title}
                  </a>
                  <button onClick={() => deleteLink(link.id)} className="text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
