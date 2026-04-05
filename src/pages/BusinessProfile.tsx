import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building2, Mail, UserPlus, Trash2, Copy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
}

export default function BusinessProfile() {
  const { business, businessId, user } = useAuth();
  const { toast } = useToast();

  // Business form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Invitation state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('cashier');
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setPhone((business as any).phone || '');
      setEmail((business as any).email || '');
      setAddress((business as any).address || '');
      setKraPin((business as any).kra_pin || '');
      setVatNumber((business as any).vat_number || '');
    }
  }, [business]);

  useEffect(() => {
    if (businessId) fetchInvitations();
  }, [businessId]);

  const fetchInvitations = async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (data) setInvitations(data as unknown as Invitation[]);
  };

  const handleSaveProfile = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({ name, phone, email, address, kra_pin: kraPin, vat_number: vatNumber })
      .eq('id', businessId);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Business Updated', description: 'Your business details have been saved.' });
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !businessId) return;
    setInviting(true);
    const { error } = await supabase
      .from('invitations')
      .insert({
        business_id: businessId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole as any,
        invited_by: user?.id,
      });
    setInviting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation Sent', description: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
      setShowInviteModal(false);
      fetchInvitations();
    }
  };

  const handleRevokeInvite = async (id: string) => {
    await supabase.from('invitations').delete().eq('id', id);
    toast({ title: 'Invitation Revoked' });
    fetchInvitations();
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copied', description: 'Invitation link copied to clipboard.' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'expired': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Business Profile</h1>
            <p className="text-muted-foreground">Manage your business details & team</p>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md h-auto p-1 bg-muted/50">
            <TabsTrigger value="details">Business Details</TabsTrigger>
            <TabsTrigger value="invitations">Team Invitations</TabsTrigger>
          </TabsList>

          {/* Business Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Business Information
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bizName">Business Name *</Label>
                  <Input id="bizName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your business name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizPhone">Phone</Label>
                  <Input id="bizPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizEmail">Email</Label>
                  <Input id="bizEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@business.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizAddress">Address</Label>
                  <Input id="bizAddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizKra">KRA PIN</Label>
                  <Input id="bizKra" value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="A123456789B" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bizVat">VAT Number</Label>
                  <Input id="bizVat" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="VAT Number" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary">
                  {saving ? 'Saving...' : 'Save Business Details'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Team Invitations
                </h2>
                <Button onClick={() => setShowInviteModal(true)} className="gradient-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>

              {invitations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No invitations yet. Invite team members to join your business.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(inv.status)}
                        <div>
                          <p className="font-medium text-foreground">{inv.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Role: <span className="capitalize">{inv.role}</span> · Sent {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={inv.status === 'pending' ? 'secondary' : inv.status === 'accepted' ? 'default' : 'destructive'} className="capitalize">
                          {inv.status}
                        </Badge>
                        {inv.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => copyInviteLink(inv.token)} title="Copy invite link">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRevokeInvite(inv.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Modal */}
        <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                The invite link will be valid for 7 days. Share it with your team member to join.
              </p>
              <Button onClick={handleSendInvite} disabled={inviting || !inviteEmail.trim()} className="w-full gradient-primary">
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
