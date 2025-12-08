import { Store, FileText, Package, BarChart3, Settings, Users, Gift, Calculator, Plug, LogOut, User, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { name: 'Billing', path: '/billing', icon: FileText, module: 'billing' },
  { name: 'Stock', path: '/stock', icon: Package, module: 'stock' },
  { name: 'Customers', path: '/customers', icon: Users, module: 'customers' },
  { name: 'Loyalty', path: '/loyalty', icon: Gift, module: 'loyalty' },
  { name: 'Accounting', path: '/accounting', icon: Calculator, module: 'accounting' },
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3, module: 'dashboard' },
  { name: 'Integrations', path: '/integrations', icon: Plug, module: 'integrations' },
  { name: 'Activity', path: '/activity', icon: Activity, module: 'dashboard' },
  { name: 'Users', path: '/users', icon: Users, module: 'users' },
  { name: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
];

export function Navbar() {
  const location = useLocation();
  const { user, profile, role, signOut, hasPermission } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/stock') {
      return location.pathname === '/stock' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  // Filter nav links based on permissions
  const visibleLinks = navLinks.filter(link => hasPermission(link.module, 'view'));

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'manager': return 'bg-warning/10 text-warning';
      case 'cashier': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-8 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Ringo Retail Shop
          </h1>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {visibleLinks.map((link) => {
            const active = isActive(link.path);
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium
                  transition-all duration-200
                  ${active 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{link.name}</span>
              </Link>
            );
          })}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge className={`mt-2 ${getRoleBadgeColor(role)} capitalize text-xs`}>
                    {role || 'User'}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
