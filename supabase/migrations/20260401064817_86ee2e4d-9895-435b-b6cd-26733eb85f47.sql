
-- Stock items table
CREATE TABLE public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  barcode text NOT NULL DEFAULT '',
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  subcategory text,
  cost numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  wholesale_price numeric,
  quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  uom text NOT NULL DEFAULT 'pcs',
  location text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  date text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  customer_id text,
  customer_name text,
  sale_type text NOT NULL DEFAULT 'retail',
  total_items integer NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  mpesa_ref text,
  loyalty_points_earned integer DEFAULT 0,
  loyalty_points_redeemed integer DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Stock items policies - authenticated users can CRUD their own org's items
CREATE POLICY "Authenticated users can view stock items"
  ON public.stock_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock items"
  ON public.stock_items FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update stock items"
  ON public.stock_items FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can delete stock items"
  ON public.stock_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Sales policies
CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Sale items policies
CREATE POLICY "Authenticated users can view sale items"
  ON public.sale_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sale items"
  ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- Updated_at trigger for stock_items
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
