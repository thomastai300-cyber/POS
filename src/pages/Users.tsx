import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  MoreVertical,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navigate } from 'react-router-dom';

type AppRole = 'admin' | 'manager' | 'cashier';

interface UserWithRole {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role: AppRole;
}

export default function UsersPage() {
  const { user, role, hasPermission } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('cashier');

  // Check permissions
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasPermission('users', 'view')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <Navbar />
        <main className="max-w-6xl mx-auto p-4 sm:p-8">
          <Card className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </Card>
        </main>
      </div>
    );
  }

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || 'cashier') as AppRole
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    if (!hasPermission('users', 'edit')) {
      toast({ title: 'Access Denied', variant: 'destructive' });
      return;
    }

    try {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          assigned_by: user?.id
        });

      if (error) throw error;

      toast({ title: 'Role Updated', description: `User role changed to ${newRole}` });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!hasPermission('users', 'edit')) {
      toast({ title: 'Access Denied', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({ 
        title: currentStatus ? 'User Deactivated' : 'User Activated',
        description: `User has been ${currentStatus ? 'deactivated' : 'activated'}.`
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'manager': return 'bg-warning/10 text-warning border-warning/20';
      case 'cashier': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage staff roles and permissions</p>
          </div>
        </div>

        <Card className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">{u.full_name}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {hasPermission('users', 'edit') && u.id !== user?.id ? (
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleChangeRole(u.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getRoleBadgeColor(u.role)} capitalize`}>
                            {u.role}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge 
                          variant={u.is_active ? 'default' : 'secondary'}
                          className={u.is_active ? 'bg-success/10 text-success' : ''}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {hasPermission('users', 'edit') && u.id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleActive(u.id, u.is_active)}>
                                {u.is_active ? (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {u.id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Permission Legend */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-foreground mb-3">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Badge className={getRoleBadgeColor('admin')}>Admin</Badge>
                <p className="mt-1 text-muted-foreground">Full access to all modules</p>
              </div>
              <div>
                <Badge className={getRoleBadgeColor('manager')}>Manager</Badge>
                <p className="mt-1 text-muted-foreground">Most access except user management</p>
              </div>
              <div>
                <Badge className={getRoleBadgeColor('cashier')}>Cashier</Badge>
                <p className="mt-1 text-muted-foreground">Billing, customers, and loyalty only</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
