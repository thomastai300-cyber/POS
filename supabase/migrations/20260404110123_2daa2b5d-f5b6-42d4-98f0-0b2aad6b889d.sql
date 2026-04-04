
-- 1. Create businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  kra_pin text,
  vat_number text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT false,
  is_whitelisted boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create business_members table
CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'cashier',
  is_owner boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- 3. Add business_id to data tables
ALTER TABLE public.stock_items ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.sale_items ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.activity_logs ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- 5. Helper: get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT business_id FROM public.business_members WHERE user_id = _user_id LIMIT 1
$$;

-- 6. Helper: is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

-- 7. RLS for businesses
CREATE POLICY "Super admins manage all businesses" ON public.businesses FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Members view own business" ON public.businesses FOR SELECT TO authenticated
  USING (id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create a business" ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 8. RLS for business_members
CREATE POLICY "Super admins manage all members" ON public.business_members FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Members view own business members" ON public.business_members FOR SELECT TO authenticated
  USING (business_id IN (SELECT bm.business_id FROM public.business_members bm WHERE bm.user_id = auth.uid()));

CREATE POLICY "Owners manage their members" ON public.business_members FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT bm.business_id FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.is_owner = true));

CREATE POLICY "Owners can update their members" ON public.business_members FOR UPDATE TO authenticated
  USING (business_id IN (SELECT bm.business_id FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.is_owner = true));

CREATE POLICY "Owners can delete their members" ON public.business_members FOR DELETE TO authenticated
  USING (business_id IN (SELECT bm.business_id FROM public.business_members bm WHERE bm.user_id = auth.uid() AND bm.is_owner = true));

-- Members can insert themselves (for self-joining during onboarding)
CREATE POLICY "Users can add themselves to business" ON public.business_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 9. Update stock_items RLS
DROP POLICY IF EXISTS "Authenticated users can view stock items" ON public.stock_items;
CREATE POLICY "View stock in own business" ON public.stock_items FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert stock items" ON public.stock_items;
CREATE POLICY "Insert stock in own business" ON public.stock_items FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update stock items" ON public.stock_items;
CREATE POLICY "Update stock in own business" ON public.stock_items FOR UPDATE TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can delete stock items" ON public.stock_items;
CREATE POLICY "Delete stock in own business" ON public.stock_items FOR DELETE TO authenticated
  USING ((business_id = public.get_user_business_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))) OR public.is_super_admin(auth.uid()));

-- 10. Update sales RLS
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
CREATE POLICY "View sales in own business" ON public.sales FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
CREATE POLICY "Insert sales in own business" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) AND user_id = auth.uid());

-- 11. Update sale_items RLS
DROP POLICY IF EXISTS "Authenticated users can view sale items" ON public.sale_items;
CREATE POLICY "View sale items in own business" ON public.sale_items FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert sale items" ON public.sale_items;
CREATE POLICY "Insert sale items in own business" ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- 12. Update activity_logs RLS
DROP POLICY IF EXISTS "Users can view own logs or admins view all" ON public.activity_logs;
CREATE POLICY "View logs in own business" ON public.activity_logs FOR SELECT TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
CREATE POLICY "Insert logs in own business" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) OR business_id IS NULL);

-- 13. Trigger for businesses updated_at
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
