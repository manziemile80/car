import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck } from 'lucide-react';

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}

/** Lets a student user connect their login to their own student record. */
export function ClaimStudentRecordDialog({ open, onOpenChange, onLinked }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('students')
      .select('id, first_name, last_name, student_id')
      .is('user_id', null)
      .order('first_name')
      .then(({ data }) => {
        setRows((data as Row[]) || []);
        setLoading(false);
      });
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows.slice(0, 30);
    return rows
      .filter((r) => `${r.first_name} ${r.last_name} ${r.student_id}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [rows, search]);

  const claim = async (row: Row) => {
    if (!user) return;
    setSaving(row.id);
    const { error } = await supabase.from('students').update({ user_id: user.id }).eq('id', row.id);
    setSaving(null);
    if (error) {
      toast({ title: 'Could not connect your profile', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Profile connected', description: `You are now ${row.first_name} ${row.last_name}.` });
    onOpenChange(false);
    onLinked();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find your student profile</DialogTitle>
          <DialogDescription>
            Pick your name so your answers are saved under your record.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Search your name or student number"
          value={search}
          maxLength={80}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matching profile found. Ask your school administrator to add you.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.first_name} {r.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.student_id}</p>
                </div>
                <Button size="sm" className="gap-1.5" disabled={saving === r.id} onClick={() => claim(r)}>
                  {saving === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  This is me
                </Button>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
