import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Search, CheckCircle, XCircle, Users, ShoppingCart,
  Package, BarChart3, Shield, Loader2
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  is_whitelisted: boolean;
  created_at: string;
  member_count?: number;
}

export default function SuperAdmin() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch member counts
      const bizIds = data.map(b => b.id);
      const { data: members } = await supabase
        .from('business_members')
        .select('business_id')
        .in('business_id', bizIds.length > 0 ? bizIds : ['__none__']);

      const countMap: Record<string, number> = {};
      (members || []).forEach(m => {
        countMap[m.business_id] = (countMap[m.business_id] || 0) + 1;
      });

      setBusinesses(data.map(b => ({ ...b, member_count: countMap[b.id] || 0 })));
    }
    setIsLoading(false);
  };

  const toggleWhitelist = async (bizId: string, current: boolean) => {
    const { error } = await supabase
      .from('businesses')
      .update({ is_whitelisted: !current, is_active: !current })
      .eq('id', bizId);

    if (!error) {
      toast({ title: current ? 'Business Suspended' : 'Business Whitelisted', description: current ? 'Business has been suspended.' : 'Business has been approved and activated.' });
      fetchBusinesses();
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  const pendingCount = businesses.filter(b => !b.is_whitelisted).length;
  const activeCount = businesses.filter(b => b.is_whitelisted && b.is_active).length;

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only super administrators can access this page.</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Administration</h1>
            <p className="text-muted-foreground text-sm">Manage all businesses on the platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Businesses', value: businesses.length, icon: Building2, color: 'text-primary' },
            { label: 'Active', value: activeCount, icon: CheckCircle, color: 'text-success' },
            { label: 'Pending Approval', value: pendingCount, icon: XCircle, color: 'text-warning' },
            { label: 'Total Users', value: businesses.reduce((s, b) => s + (b.member_count || 0), 0), icon: Users, color: 'text-info' },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search businesses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 max-w-md" />
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({businesses.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'active'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredBusinesses
                    .filter(b => tab === 'all' ? true : tab === 'pending' ? !b.is_whitelisted : b.is_whitelisted)
                    .map((biz) => (
                      <Card key={biz.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground text-lg">{biz.name}</h3>
                                <Badge variant={biz.is_whitelisted ? 'default' : 'secondary'} className={biz.is_whitelisted ? 'bg-success text-success-foreground' : ''}>
                                  {biz.is_whitelisted ? 'Active' : 'Pending'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {biz.email && <span>{biz.email}</span>}
                                {biz.phone && <span>{biz.phone}</span>}
                                {biz.address && <span>{biz.address}</span>}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {biz.member_count} members</span>
                                <span>Registered {new Date(biz.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={biz.is_whitelisted ? 'destructive' : 'default'}
                              onClick={() => toggleWhitelist(biz.id, biz.is_whitelisted)}
                              className={!biz.is_whitelisted ? 'gradient-primary' : ''}
                            >
                              {biz.is_whitelisted ? (
                                <><XCircle className="w-4 h-4 mr-1" /> Suspend</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  {filteredBusinesses.filter(b => tab === 'all' ? true : tab === 'pending' ? !b.is_whitelisted : b.is_whitelisted).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No businesses found</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
