CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  supplier text,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ordered','received','cancelled')),
  expected_date date,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock managers manage purchase orders" ON public.purchase_orders
FOR ALL TO authenticated USING (public.can_manage_stock(auth.uid())) WITH CHECK (public.can_manage_stock(auth.uid()));

CREATE POLICY "Staff view purchase orders" ON public.purchase_orders
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.can_manage_stock(auth.uid()));

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();