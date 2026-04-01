
-- Create the trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing user: create profile
INSERT INTO public.profiles (id, full_name, email)
VALUES ('04f4fdcd-4b7d-4f39-8e60-12a7a8e9e9e0', 'tai', 'thomastai300@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- Backfill existing user: assign admin role (first user)
INSERT INTO public.user_roles (user_id, role)
VALUES ('04f4fdcd-4b7d-4f39-8e60-12a7a8e9e9e0', 'admin')
ON CONFLICT DO NOTHING;

-- Seed role_permissions for all roles and modules
INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'stock', true, true, true, true),
  ('admin', 'billing', true, true, true, true),
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'customers', true, true, true, true),
  ('admin', 'loyalty', true, true, true, true),
  ('admin', 'accounting', true, true, true, true),
  ('admin', 'integrations', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  ('admin', 'users', true, true, true, true),
  ('manager', 'stock', true, true, true, false),
  ('manager', 'billing', true, true, true, false),
  ('manager', 'dashboard', true, true, false, false),
  ('manager', 'customers', true, true, true, false),
  ('manager', 'loyalty', true, true, true, false),
  ('manager', 'accounting', true, true, false, false),
  ('manager', 'integrations', true, false, false, false),
  ('manager', 'settings', true, false, false, false),
  ('manager', 'users', false, false, false, false),
  ('cashier', 'stock', true, false, false, false),
  ('cashier', 'billing', true, true, false, false),
  ('cashier', 'dashboard', false, false, false, false),
  ('cashier', 'customers', true, true, false, false),
  ('cashier', 'loyalty', true, false, false, false),
  ('cashier', 'accounting', false, false, false, false),
  ('cashier', 'integrations', false, false, false, false),
  ('cashier', 'settings', false, false, false, false),
  ('cashier', 'users', false, false, false, false)
ON CONFLICT DO NOTHING;
