
-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'cashier',
  invited_by uuid REFERENCES auth.users(id),
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE(business_id, email, status)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Business owners/admins can manage invitations for their business
CREATE POLICY "Admins manage own business invitations"
  ON public.invitations FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))
  WITH CHECK (business_id = get_user_business_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Super admins can see all invitations
CREATE POLICY "Super admins manage all invitations"
  ON public.invitations FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Allow business owners to update their business details
CREATE POLICY "Business owners can update own business"
  ON public.businesses FOR UPDATE TO authenticated
  USING (id IN (SELECT bm.business_id FROM business_members bm WHERE bm.user_id = auth.uid() AND bm.is_owner = true));
