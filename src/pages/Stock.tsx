import { useEffect, useMemo, useState } from 'react';
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
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Loader2,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  AlertTriangle,
  Warehouse,
  Files,
  Download,
} from 'lucide-react';

interface StockCategory {
  id: string;
  name: string;
  description: string | null;
}

interface StockSupplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
}

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
  movement_type: 'in' | 'out';
  quantity: number;
  reason: string | null;
  movement_date: string;
  created_at: string;
  recorded_by: string;
  item_name?: string;
  recorded_by_name?: string;
}

const emptyItem = {
  name: '',
  category: 'General',
  unit: 'pcs',
  quantity: '0',
  min_quantity: '0',
  location: '',
  notes: '',
};

export default function Stock() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const canManage = role === 'admin' || role === 'stock_manager';
  const canView = role === 'admin' || role === 'stock_manager' || role === 'viewer';

  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const [suppliers, setSuppliers] = useState<StockSupplier[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem);

  const [moveItem, setMoveItem] = useState<StockItem | null>(null);
  const [moveType, setMoveType] = useState<'in' | 'out'>('in');
  const [moveQty, setMoveQty] = useState('1');
  const [moveReason, setMoveReason] = useState('');

  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  useEffect(() => {
    if (canView) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [role]);

  const fetchAll = async () => {
    setLoading(true);

    const [itemsRes, movementsRes, categoriesRes, suppliersRes, profilesRes] = await Promise.all([
      supabase.from('stock_items').select('*').order('name'),
      supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('stock_categories').select('*').order('name'),
      supabase.from('stock_suppliers').select('*').order('name'),
      supabase.from('profiles').select('user_id, full_name'),
    ]);

    const list = (itemsRes.data as StockItem[]) || [];
    const movementList = (movementsRes.data as Movement[]) || [];
    const categoryList = (categoriesRes.data as StockCategory[]) || [];
    const supplierList = (suppliersRes.data as StockSupplier[]) || [];
    const profileMap = Object.fromEntries(
      ((profilesRes.data as Array<{ user_id: string; full_name: string }> ) || []).map((p) => [p.user_id, p.full_name]),
    );

    const enrichedMovements = movementList.map((movement) => ({
      ...movement,
      item_name: list.find((item) => item.id === movement.item_id)?.name || 'Unknown item',
      recorded_by_name: profileMap[movement.recorded_by] || 'Unknown user',
    }));

    setItems(list);
    setMovements(enrichedMovements);
    setCategories(categoryList);
    setSuppliers(supplierList);
    setLoading(false);
  };

  const lowStock = useMemo(
    () => items.filter((item) => Number(item.quantity) <= Number(item.min_quantity)),
    [items],
  );

  const totalAvailable = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity), 0),
    [items],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatches = categoryFilter === 'all' || item.category === categoryFilter;
      const searchMatch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.location?.toLowerCase().includes(search.toLowerCase());
      return categoryMatches && searchMatch;
    });
  }, [items, search, categoryFilter]);

  const categoryOptions = useMemo(
    () => [...new Set(['General', ...items.map((item) => item.category), ...categories.map((category) => category.name)])],
    [items, categories],
  );

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...emptyItem,
      category: categories[0]?.name || 'General',
    });
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

    const itemName = form.name.trim().slice(0, 150);
    const categoryName = form.category.trim() || 'General';
    const unitName = form.unit.trim().slice(0, 30) || 'pcs';
    const quantity = Math.max(Number(form.quantity) || 0, 0);
    const minimum = Math.max(Number(form.min_quantity) || 0, 0);

    if (quantity < 0 || minimum < 0) {
      toast({ title: 'Stock values cannot be negative', variant: 'destructive' });
      return;
    }

    const payload = {
      name: itemName,
      category: categoryName,
      unit: unitName,
      quantity,
      min_quantity: minimum,
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

    if (categoryName && !categories.some((category) => category.name.toLowerCase() === categoryName.toLowerCase())) {
      await supabase.from('stock_categories').upsert(
        {
          name: categoryName,
          description: 'Created from inventory management',
          created_by: user!.id,
        },
        { onConflict: 'name' },
      );
    }

    toast({ title: editingId ? 'Item updated' : 'Item added' });
    setOpen(false);
    fetchAll();
  };

  const removeItem = async (id: string) => {
    if (!window.confirm('Delete this stock item? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase.from('stock_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete item', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Item deleted' });
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
      movement_date: new Date().toISOString().slice(0, 10),
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

  const exportReport = () => {
    const rows = [
      ['Item', 'Category', 'Quantity', 'Minimum Level', 'Location', 'Unit'],
      ...items.map((item) => [
        item.name,
        item.category,
        String(item.quantity),
        String(item.min_quantity),
        item.location || '',
        item.unit,
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'school-stock-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Stock report exported' });
  };

  if (!canView) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
              <h2 className="text-xl font-semibold">Access restricted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This stock area is restricted to administrators, stock managers, and read-only viewers.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Operations"
        title="Stock Management"
        description={
          canManage
            ? 'Manage inventory, record stock movements, track suppliers and generate reports.'
            : 'Review stock levels, low-stock alerts, and recent inventory movements.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={exportReport}>
              <Download className="h-4 w-4" /> Report
            </Button>
            {canManage && (
              <Button className="gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" /> New Item
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total items</p>
            <p className="text-2xl font-semibold text-foreground">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Available stock</p>
            <p className="text-2xl font-semibold text-foreground">{totalAvailable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low stock alerts</p>
            <p className="text-2xl font-semibold text-destructive">{lowStock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recent transactions</p>
            <p className="text-2xl font-semibold text-foreground">{movements.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search inventory, category, or storage location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <Package className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No inventory matches your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const isLowStock = Number(item.quantity) <= Number(item.min_quantity);
            return (
              <Card key={item.id} className="flex flex-col rounded-2xl">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">
                      {item.category}
                      {item.location ? ` · ${item.location}` : ''}
                    </p>
                    {isLowStock && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory categories</p>
                <h3 className="font-semibold text-foreground">{categoryOptions.length} active</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((category) => (
                <Badge key={category} variant="outline" className="capitalize">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <Files className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered suppliers</p>
                <h3 className="font-semibold text-foreground">{suppliers.length}</h3>
              </div>
            </div>
            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suppliers added yet.</p>
              ) : (
                suppliers.slice(0, 4).map((supplier) => (
                  <div key={supplier.id} className="rounded-xl border border-border p-2 text-sm">
                    <p className="font-medium text-foreground">{supplier.name}</p>
                    {supplier.contact_name && <p className="text-muted-foreground">{supplier.contact_name}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Item name</Label>
              <Input value={form.name} maxLength={150} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} maxLength={30} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </div>
              <div>
                <Label>Quantity in stock</Label>
                <Input type="number" min={0} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
              </div>
              <div>
                <Label>Minimum level</Label>
                <Input type="number" min={0} value={form.min_quantity} onChange={(event) => setForm({ ...form, min_quantity: event.target.value })} />
              </div>
            </div>

            <div>
              <Label>Storage location</Label>
              <Input value={form.location} maxLength={150} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} maxLength={500} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem}>{editingId ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveItem} onOpenChange={(isOpen) => !isOpen && setMoveItem(null)}>
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
              <Label>Quantity</Label>
              <Input type="number" min={1} value={moveQty} onChange={(event) => setMoveQty(event.target.value)} />
            </div>
            <div>
              <Label>Reason / reference</Label>
              <Input
                value={moveReason}
                maxLength={300}
                placeholder={moveType === 'in' ? 'Purchase order, donation...' : 'Issued to a class, workshop...'}
                onChange={(event) => setMoveReason(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>
              Cancel
            </Button>
            <Button onClick={saveMovement}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyItem} onOpenChange={(isOpen) => !isOpen && setHistoryItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{historyItem?.name} — Stock History</DialogTitle>
          </DialogHeader>

          {(() => {
            const rows = movements.filter((movement) => movement.item_id === historyItem?.id);
            if (rows.length === 0) {
              return <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>;
            }

            return (
              <div className="space-y-2">
                {rows.map((movement) => (
                  <div key={movement.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {movement.movement_type === 'in' ? 'Received' : 'Issued'} {movement.quantity} {historyItem?.unit}
                      </p>
                      <Badge variant={movement.movement_type === 'in' ? 'secondary' : 'outline'}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(movement.movement_date).toLocaleDateString()} · {movement.recorded_by_name}
                    </p>
                    {movement.reason && <p className="mt-1 text-xs text-muted-foreground">{movement.reason}</p>}
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
