CREATE TABLE public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  unit text NOT NULL DEFAULT 'pcs',
  quantity numeric NOT NULL DEFAULT 0,
  min_quantity numeric NOT NULL DEFAULT 0,
  location text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in','out')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  reason text,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO authenticated;
GRANT ALL ON public.stock_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_stock(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'stock_manager')
$$;

CREATE POLICY "Stock managers manage items" ON public.stock_items
FOR ALL TO authenticated USING (public.can_manage_stock(auth.uid())) WITH CHECK (public.can_manage_stock(auth.uid()));

CREATE POLICY "Staff view items" ON public.stock_items
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.can_manage_stock(auth.uid()));

CREATE POLICY "Stock managers manage movements" ON public.stock_movements
FOR ALL TO authenticated USING (public.can_manage_stock(auth.uid())) WITH CHECK (public.can_manage_stock(auth.uid()));

CREATE POLICY "Staff view movements" ON public.stock_movements
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.can_manage_stock(auth.uid()));

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.stock_items SET quantity = quantity + NEW.quantity, updated_at = now() WHERE id = NEW.item_id;
  ELSE
    UPDATE public.stock_items SET quantity = GREATEST(quantity - NEW.quantity, 0), updated_at = now() WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stock_movements_apply AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

REVOKE EXECUTE ON FUNCTION public.can_manage_stock(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM anon, authenticated;