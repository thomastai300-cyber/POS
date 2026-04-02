import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Search, 
  Filter,
  User,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Calculator,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  module: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const moduleIcons: Record<string, React.ElementType> = {
  auth: LogIn,
  billing: ShoppingCart,
  stock: Package,
  customers: Users,
  loyalty: Users,
  accounting: Calculator,
  settings: Settings,
  users: User,
};

const actionColors: Record<string, string> = {
  login: 'bg-success/10 text-success',
  logout: 'bg-muted text-muted-foreground',
  create: 'bg-primary/10 text-primary',
  update: 'bg-warning/10 text-warning',
  delete: 'bg-destructive/10 text-destructive',
  sale: 'bg-success/10 text-success',
  refund: 'bg-destructive/10 text-destructive',
  stock_adjustment: 'bg-warning/10 text-warning',
  role_change: 'bg-primary/10 text-primary',
  export: 'bg-muted text-muted-foreground',
};

export default function ActivityLogs() {
  const { user, hasPermission } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only admins and managers can view activity logs
  if (!hasPermission('dashboard', 'view')) {
    return (
      <AppLayout>
        <
        <div className="max-w-6xl mx-auto p-4 sm:p-8">
          <Card className="p-8 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view activity logs.</p>
          </Card>
        </div>
      </div>
    );
  }

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data as ActivityLog[]) || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesModule && matchesAction;
  });

  const uniqueModules = [...new Set(logs.map(l => l.module))];
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
              <p className="text-muted-foreground">Track all user actions in the system</p>
            </div>
          </div>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueModules.map(m => (
                  <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(a => (
                  <SelectItem key={a} value={a} className="capitalize">{a.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading activity logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No activity logs found</p>
              </div>
            ) : (
              filteredLogs.map(log => {
                const ModuleIcon = moduleIcons[log.module] || Activity;
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ModuleIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${actionColors[log.action] || 'bg-muted'} capitalize text-xs`}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <p className="text-foreground mt-1">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{log.user_name || 'System'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredLogs.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
