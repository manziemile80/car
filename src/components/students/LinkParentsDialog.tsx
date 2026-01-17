import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Parent, StudentParent } from '@/types/database';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkParentsDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface LinkedParent extends StudentParent {
  parent?: Parent;
}

export function LinkParentsDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
  onUpdate,
}: LinkParentsDialogProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New link form
  const [selectedParentId, setSelectedParentId] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [parentsRes, linkedRes] = await Promise.all([
        supabase.from('parents').select('*').order('full_name'),
        supabase
          .from('student_parents')
          .select('*, parent:parents(*)')
          .eq('student_id', studentId),
      ]);

      if (parentsRes.data) {
        setParents(parentsRes.data);
      }
      if (linkedRes.data) {
        setLinkedParents(linkedRes.data as LinkedParent[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkParent = async () => {
    if (!selectedParentId) {
      toast.error('Please select a parent');
      return;
    }

    // Check if already linked
    if (linkedParents.some((lp) => lp.parent_id === selectedParentId)) {
      toast.error('This parent is already linked to this student');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('student_parents').insert({
        student_id: studentId,
        parent_id: selectedParentId,
        relationship,
        is_primary_contact: isPrimaryContact,
      });

      if (error) throw error;

      toast.success('Parent linked successfully');
      setSelectedParentId('');
      setRelationship('parent');
      setIsPrimaryContact(false);
      fetchData();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to link parent', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkParent = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('student_parents')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast.success('Parent unlinked');
      fetchData();
      onUpdate();
    } catch (error: any) {
      toast.error('Failed to unlink parent', { description: error.message });
    }
  };

  const handleTogglePrimary = async (linkId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('student_parents')
        .update({ is_primary_contact: !currentValue })
        .eq('id', linkId);

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      toast.error('Failed to update', { description: error.message });
    }
  };

  const availableParents = parents.filter(
    (p) => !linkedParents.some((lp) => lp.parent_id === p.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Parents to {studentName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current linked parents */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Linked Parents</Label>
              {linkedParents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No parents linked yet
                </p>
              ) : (
                <div className="space-y-2">
                  {linkedParents.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{link.parent?.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{link.relationship}</span>
                          {link.is_primary_contact && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {link.parent?.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTogglePrimary(link.id, link.is_primary_contact)
                          }
                        >
                          {link.is_primary_contact
                            ? 'Remove Primary'
                            : 'Set Primary'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleUnlinkParent(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new link */}
            {availableParents.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium">Link New Parent</Label>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent</Label>
                    <Select
                      value={selectedParentId}
                      onValueChange={setSelectedParentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.full_name} ({parent.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select value={relationship} onValueChange={setRelationship}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="primary"
                      checked={isPrimaryContact}
                      onCheckedChange={(checked) =>
                        setIsPrimaryContact(checked === true)
                      }
                    />
                    <Label htmlFor="primary" className="text-sm font-normal">
                      Set as primary contact for SMS notifications
                    </Label>
                  </div>
                  <Button
                    onClick={handleLinkParent}
                    disabled={saving || !selectedParentId}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Link Parent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {availableParents.length === 0 && parents.length > 0 && (
              <p className="text-sm text-muted-foreground border-t pt-4">
                All available parents have been linked to this student.
              </p>
            )}

            {parents.length === 0 && (
              <p className="text-sm text-muted-foreground border-t pt-4">
                No parents available. Please add parents first on the Parents page.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
