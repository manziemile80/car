import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  studentId: string;
  studentName: string;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}

interface Candidate {
  user_id: string;
  full_name: string;
  email: string;
}

export function LinkStudentAccountDialog({
  studentId,
  studentName,
  currentUserId,
  open,
  onOpenChange,
  onLinked,
}: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');
      if (error) toast.error('Failed to load accounts', { description: error.message });
      setCandidates((data as Candidate[]) || []);
      setLoading(false);
    };
    load();
  }, [open]);

  const link = async (userId: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({ user_id: userId })
      .eq('id', studentId);
    setSaving(false);
    if (error) {
      toast.error('Failed to update login link', { description: error.message });
      return;
    }
    toast.success(userId ? 'Login account linked' : 'Login account unlinked');
    onLinked();
    onOpenChange(false);
  };

  const filtered = candidates.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100%-1rem)]">
        <DialogHeader>
          <DialogTitle>Link login account — {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Search accounts</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
            />
          </div>

          {currentUserId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={saving}
              onClick={() => link(null)}
            >
              <Link2Off className="h-4 w-4" />
              Unlink current account
            </Button>
          )}

          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No accounts found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.user_id}
                  type="button"
                  disabled={saving}
                  onClick={() => link(c.user_id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    c.user_id === currentUserId ? 'bg-primary/10' : ''
                  }`}
                >
                  <span>
                    <span className="block font-medium text-foreground">{c.full_name}</span>
                    <span className="block text-xs text-muted-foreground">{c.email}</span>
                  </span>
                  {c.user_id === currentUserId && (
                    <span className="text-xs font-medium text-primary">Linked</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
