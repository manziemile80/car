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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Search, Loader2, Package, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  location: string | null;
  notes: string | null;
}

interface Movement {
  id: string;
  item_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  movement_date: string;
}

const emptyItem = {
  name: '',
  category: 'general',
  unit: 'pcs',
  quantity: '0',
  min_quantity: '0',
  location: '',
  notes: '',
};

const categories = ['general', 'stationery', 'furniture', 'ict', 'kitchen', 'cleaning', 'sports', 'lab'];

export default function Stock() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const canManage = role === 'admin' || role === 'stock_manager';

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem);

  const [moveItem, setMoveItem] = useState<StockItem | null>(null);
  const [moveType, setMoveType] = useState<'in' | 'out'>('in');
  const [moveQty, setMoveQty] = useState('1');
  const [moveReason, setMoveReason] = useState('');

  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [i, m] = await Promise.all([
      supabase.from('stock_items').select('*').order('name'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(300),
    ]);
    setItems((i.data as StockItem[]) || []);
    setMovements((m.data as Movement[]) || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyItem);
    setOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      location: item.location || '',
      notes: item.notes || '',
    });
    setOpen(true);
  };

  const saveItem = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Item name is required', variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name.trim().slice(0, 150),
      category: form.category,
      unit: form.unit.trim().slice(0, 30) || 'pcs',
      quantity: Math.max(Number(form.quantity) || 0, 0),
      min_quantity: Math.max(Number(form.min_quantity) || 0, 0),
      location: form.location.trim().slice(0, 150) || null,
      notes: form.notes.trim().slice(0, 500) || null,
    };
    const { error } = editingId
      ? await supabase.from('stock_items').update(payload).eq('id', editingId)
      : await supabase.from('stock_items').insert({ ...payload, created_by: user!.id });
    if (error) {
      toast({ title: 'Could not save item', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Item updated' : 'Item added' });
    setOpen(false);
    fetchAll();
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('stock_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete item', description: error.message, variant: 'destructive' });
      return;
    }
    fetchAll();
  };

  const openMove = (item: StockItem, type: 'in' | 'out') => {
    setMoveItem(item);
    setMoveType(type);
    setMoveQty('1');
    setMoveReason('');
  };

  const saveMovement = async () => {
    if (!moveItem) return;
    const qty = Number(moveQty);
    if (!qty || qty <= 0) {
      toast({ title: 'Enter an amount greater than zero', variant: 'destructive' });
      return;
    }
    if (moveType === 'out' && qty > Number(moveItem.quantity)) {
      toast({
        title: 'Not enough in stock',
        description: `Only ${moveItem.quantity} ${moveItem.unit} available.`,
        variant: 'destructive',
      });
      return;
    }
    const { error } = await supabase.from('stock_movements').insert({
      item_id: moveItem.id,
      movement_type: moveType,
      quantity: qty,
      reason: moveReason.trim().slice(0, 300) || null,
      recorded_by: user!.id,
    });
    if (error) {
      toast({ title: 'Could not record movement', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: moveType === 'in' ? 'Stock received' : 'Stock issued' });
    setMoveItem(null);
    fetchAll();
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  );
  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.min_quantity));

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Operations"
        title="Stock Management"
        description={
          canManage
            ? 'Track school supplies, record what comes in and what is issued out.'
            : 'View the school stock list and current quantities.'
        }
        actions={
          canManage ? (
            <Button className="gap-2" onClick={openNew}>
              <Plus className="h-4 w-4" /> New Item
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Items tracked</p>
            <p className="text-2xl font-semibold text-foreground">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low or out of stock</p>
            <p className="text-2xl font-semibold text-destructive">{lowStock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Movements recorded</p>
            <p className="text-2xl font-semibold text-foreground">{movements.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search item or category"
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
            <Package className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No stock items yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const low = Number(item.quantity) <= Number(item.min_quantity);
            return (
              <Card key={item.id} className="flex flex-col rounded-2xl">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <Badge variant={low ? 'destructive' : 'secondary'}>
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">
                      {item.category}
                      {item.location ? ` · ${item.location}` : ''}
                    </p>
                    {low && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        At or below minimum level ({item.min_quantity} {item.unit})
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    {canManage && (
                      <>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openMove(item, 'in')}>
                          <ArrowDownCircle className="h-4 w-4" /> Receive
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openMove(item, 'out')}>
                          <ArrowUpCircle className="h-4 w-4" /> Issue
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setHistoryItem(item)}>
                      <History className="h-4 w-4" /> History
                    </Button>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="icon" aria-label="Edit item" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete item" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / edit item */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Item name</Label>
              <Input value={form.name} maxLength={150} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit (pcs, box, kg...)</Label>
                <Input value={form.unit} maxLength={30} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div>
                <Label>Quantity in stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label>Minimum level</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Storage location</Label>
              <Input value={form.location} maxLength={150} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} maxLength={500} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveItem}>{editingId ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive / issue */}
      <Dialog open={!!moveItem} onOpenChange={(o) => !o && setMoveItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moveType === 'in' ? 'Receive stock' : 'Issue stock'} — {moveItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Currently in stock: {moveItem?.quantity} {moveItem?.unit}
            </p>
            <div>
              <Label>Amount</Label>
              <Input type="number" min={1} value={moveQty} onChange={(e) => setMoveQty(e.target.value)} />
            </div>
            <div>
              <Label>Reason / reference</Label>
              <Input
                value={moveReason}
                maxLength={300}
                placeholder={moveType === 'in' ? 'Purchase, donation...' : 'Given to class, repair...'}
                onChange={(e) => setMoveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Cancel</Button>
            <Button onClick={saveMovement}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={!!historyItem} onOpenChange={(o) => !o && setHistoryItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{historyItem?.name} — Movements</DialogTitle>
          </DialogHeader>
          {(() => {
            const rows = movements.filter((m) => m.item_id === historyItem?.id);
            if (rows.length === 0) return <p className="text-sm text-muted-foreground">No movements recorded yet.</p>;
            return (
              <div className="space-y-2">
                {rows.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.movement_type === 'in' ? 'Received' : 'Issued'} {m.quantity} {historyItem?.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.movement_date).toLocaleDateString()}
                        {m.reason ? ` · ${m.reason}` : ''}
                      </p>
                    </div>
                    <Badge variant={m.movement_type === 'in' ? 'secondary' : 'outline'}>
                      {m.movement_type === 'in' ? '+' : '−'}{m.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
