import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  MessageSquare, 
  CreditCard, 
  Printer,
  ScanBarcode,
  Wifi,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function Integrations() {
  const { mpesaSettings, smsSettings, updateMpesaSettings, updateSMSSettings } = useSettingsStore();
  const { toast } = useToast();

  const [mpesaForm, setMpesaForm] = useState({
    tillNumber: mpesaSettings.tillNumber || '',
    paybillNumber: mpesaSettings.paybillNumber || '',
    accountNumber: mpesaSettings.accountNumber || '',
  });

  const [smsForm, setSmsForm] = useState({
    provider: smsSettings.provider || '',
    apiKey: smsSettings.apiKey || '',
    senderId: smsSettings.senderId || '',
  });

  const handleSaveMpesa = () => {
    updateMpesaSettings({
      ...mpesaForm,
      isConfigured: !!(mpesaForm.tillNumber || mpesaForm.paybillNumber),
    });
    toast({ title: 'Success', description: 'M-Pesa settings saved. Enable Cloud for live integration.' });
  };

  const handleSaveSMS = () => {
    updateSMSSettings({
      ...smsForm,
      isConfigured: !!(smsForm.provider && smsForm.apiKey),
    });
    toast({ title: 'Success', description: 'SMS settings saved. Enable Cloud for live integration.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Wifi className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrations</h1>
            <p className="text-muted-foreground">Connect external services and hardware</p>
          </div>
        </div>

        {/* Integration Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <ScanBarcode className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Barcode Scanner</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">Connected</span>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${mpesaSettings.isConfigured ? 'bg-success/10' : 'bg-muted'}`}>
                <Smartphone className={`w-5 h-5 ${mpesaSettings.isConfigured ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">M-Pesa</p>
                <div className="flex items-center gap-1">
                  {mpesaSettings.isConfigured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs text-success">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Not configured</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${smsSettings.isConfigured ? 'bg-success/10' : 'bg-muted'}`}>
                <MessageSquare className={`w-5 h-5 ${smsSettings.isConfigured ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">SMS</p>
                <div className="flex items-center gap-1">
                  {smsSettings.isConfigured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs text-success">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Not configured</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Printer className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Thermal Printer</p>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-xs text-warning">Browser Print</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="mpesa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="hardware">POS Hardware</TabsTrigger>
          </TabsList>

          <TabsContent value="mpesa">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-6 h-6 text-success" />
                <div>
                  <h2 className="text-xl font-semibold">M-Pesa Integration</h2>
                  <p className="text-sm text-muted-foreground">Configure Lipa na M-Pesa for payments</p>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Cloud Required</p>
                    <p className="text-sm text-muted-foreground">
                      Live M-Pesa integration requires Lovable Cloud for secure API handling. 
                      Configure your details below and enable Cloud when ready.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Buy Goods (Till Number)</h3>
                  <div className="space-y-2">
                    <Label>Till Number</Label>
                    <Input
                      value={mpesaForm.tillNumber}
                      onChange={(e) => setMpesaForm({ ...mpesaForm, tillNumber: e.target.value })}
                      placeholder="e.g., 123456"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Paybill</h3>
                  <div className="space-y-2">
                    <Label>Paybill Number</Label>
                    <Input
                      value={mpesaForm.paybillNumber}
                      onChange={(e) => setMpesaForm({ ...mpesaForm, paybillNumber: e.target.value })}
                      placeholder="e.g., 888880"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={mpesaForm.accountNumber}
                      onChange={(e) => setMpesaForm({ ...mpesaForm, accountNumber: e.target.value })}
                      placeholder="Account/Business number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveMpesa}>Save M-Pesa Settings</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sms">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-info" />
                <div>
                  <h2 className="text-xl font-semibold">SMS Integration</h2>
                  <p className="text-sm text-muted-foreground">Send bulk SMS to customers</p>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Cloud Required</p>
                    <p className="text-sm text-muted-foreground">
                      Live SMS sending requires Lovable Cloud. Supports Africa's Talking, Twilio, and other providers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Input
                    value={smsForm.provider}
                    onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })}
                    placeholder="e.g., Africa's Talking, Twilio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={smsForm.apiKey}
                    onChange={(e) => setSmsForm({ ...smsForm, apiKey: e.target.value })}
                    placeholder="Your API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input
                    value={smsForm.senderId}
                    onChange={(e) => setSmsForm({ ...smsForm, senderId: e.target.value })}
                    placeholder="e.g., RINGOSHOP"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveSMS}>Save SMS Settings</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hardware">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">POS Hardware</h2>
                  <p className="text-sm text-muted-foreground">Configure hardware peripherals</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-4 border-success/30 bg-success/5">
                  <div className="flex items-center gap-3 mb-3">
                    <ScanBarcode className="w-6 h-6 text-success" />
                    <div>
                      <h3 className="font-semibold">Barcode Scanner</h3>
                      <Badge variant="outline" className="text-success border-success">Active</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    USB barcode scanners are automatically detected. Simply plug in and scan products in the POS.
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Printer className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Receipt Printer</h3>
                      <Badge variant="secondary">Browser Print</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Currently using browser print dialog. For direct thermal printer support, enable Cloud.
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Card Reader</h3>
                      <Badge variant="secondary">Not configured</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Card payment integration requires Cloud and a supported payment terminal.
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Cash Drawer</h3>
                      <Badge variant="secondary">Not configured</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cash drawer can be triggered automatically after sales with printer integration.
                  </p>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
