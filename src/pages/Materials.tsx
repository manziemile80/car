import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FolderOpen, Download, Search, Loader2, Pencil } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  subject_id: string | null;
  class_id: string | null;
  created_at: string;
}

const emptyForm = { title: '', description: '', file_url: '', subject_id: '', class_id: '' };

export default function Materials() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const isStaff = role === 'admin' || role === 'teacher';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [m, s, c] = await Promise.all([
      supabase.from('materials').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('classes').select('id, name').order('name'),
    ]);
    setMaterials((m.data as Material[]) || []);
    setSubjects(s.data || []);
    setClasses(c.data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    const payload = {
      title: form.title.trim().slice(0, 150),
      description: form.description.trim().slice(0, 1000) || null,
      file_url: form.file_url.trim().slice(0, 500) || null,
      subject_id: form.subject_id || null,
      class_id: form.class_id || null,
      uploaded_by: user!.id,
    };
    const { error } = editingId
      ? await supabase.from('materials').update(payload).eq('id', editingId)
      : await supabase.from('materials').insert(payload);
    if (error) {
      toast({ title: 'Could not save material', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Material updated' : 'Material added' });
    setOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchAll();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    fetchAll();
  };

  const filtered = materials.filter((m) =>
    `${m.title} ${m.description || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const label = (list: { id: string; name: string }[], id: string | null) =>
    list.find((x) => x.id === id)?.name;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="E-learning"
        title="Learning Materials"
        description="Notes, PDFs and resources shared with students for each subject and class."
        actions={
          isStaff ? (
            <Button
              className="gap-2"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add Material
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No materials found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.id} className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {m.description || 'No description'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  {label(subjects, m.subject_id) && (
                    <span className="rounded-full bg-muted px-2 py-0.5">{label(subjects, m.subject_id)}</span>
                  )}
                  {label(classes, m.class_id) && (
                    <span className="rounded-full bg-muted px-2 py-0.5">{label(classes, m.class_id)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {m.file_url && (
                    <a href={m.file_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-4 w-4" /> Open
                      </Button>
                    </a>
                  )}
                  {isStaff && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit material"
                        onClick={() => {
                          setEditingId(m.id);
                          setForm({
                            title: m.title,
                            description: m.description || '',
                            file_url: m.file_url || '',
                            subject_id: m.subject_id || '',
                            class_id: m.class_id || '',
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete material" onClick={() => remove(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Material' : 'Add Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>File / resource link</Label>
              <Input
                value={form.file_url}
                maxLength={500}
                placeholder="https://..."
                onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? 'Save Changes' : 'Add Material'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
