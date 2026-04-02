import { Store, FileText, Package, BarChart3, Settings, Users, Gift, Calculator, Plug, LogOut, User, Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const mainNavLinks = [
  { name: 'Billing', path: '/billing', icon: FileText, module: 'billing' },
  { name: 'Stock', path: '/stock', icon: Package, module: 'stock' },
  { name: 'Customers', path: '/customers', icon: Users, module: 'customers' },
  { name: 'Loyalty', path: '/loyalty', icon: Gift, module: 'loyalty' },
];

const managementNavLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3, module: 'dashboard' },
  { name: 'Accounting', path: '/accounting', icon: Calculator, module: 'accounting' },
  { name: 'Activity', path: '/activity', icon: Activity, module: 'dashboard' },
];

const systemNavLinks = [
  { name: 'Users', path: '/users', icon: Users, module: 'users' },
  { name: 'Integrations', path: '/integrations', icon: Plug, module: 'integrations' },
  { name: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, profile, role, signOut, hasPermission } = useAuth();

  const isActive = (path: string) => {
    if (path === '/stock') {
      return location.pathname === '/stock' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'manager': return 'bg-warning/10 text-warning';
      case 'cashier': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderNavGroup = (links: typeof mainNavLinks, label: string) => {
    const visibleLinks = links.filter(link => hasPermission(link.module, 'view'));
    if (visibleLinks.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleLinks.map((link) => (
              <SidebarMenuItem key={link.name}>
                <SidebarMenuButton asChild isActive={isActive(link.path)}>
                  <NavLink to={link.path} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                    <link.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{link.name}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold text-foreground truncate">
              Ringo Retail
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderNavGroup(mainNavLinks, 'Sales')}
        {renderNavGroup(managementNavLinks, 'Management')}
        {renderNavGroup(systemNavLinks, 'System')}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                <User className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <Badge className={`${getRoleBadgeColor(role)} capitalize text-[10px] px-1.5 py-0`}>
                      {role || 'User'}
                    </Badge>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
