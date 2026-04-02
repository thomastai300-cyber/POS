import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Store, Receipt, Bell, Moon, Sun, Monitor, Ruler, Plus, Trash2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { toast } = useToast();
  const { 
    organization, 
    terminals, 
    unitsOfMeasure, 
    stockLocations,
    updateOrganization, 
    addTerminal, 
    updateTerminal, 
    deleteTerminal,
    addUOM,
    deleteUOM,
    addStockLocation,
    deleteStockLocation
  } = useSettingsStore();
  
  const [darkMode, setDarkMode] = useState(organization.darkMode);
  const [notifications, setNotifications] = useState(organization.lowStockAlerts);
  const [autoPrint, setAutoPrint] = useState(organization.autoPrintReceipt);
  
  // Form states
  const [newTerminalName, setNewTerminalName] = useState('');
  const [newUomName, setNewUomName] = useState('');
  const [newUomSymbol, setNewUomSymbol] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');

  const handleSaveOrganization = () => {
    toast({
      title: 'Settings Saved',
      description: 'Organization settings have been updated.',
    });
  };

  const handleAddTerminal = () => {
    if (!newTerminalName.trim()) return;
    addTerminal({
      name: newTerminalName,
      location: 'Main Store',
      isActive: true
    });
    setNewTerminalName('');
    toast({ title: 'Terminal Added', description: `${newTerminalName} has been added.` });
  };

  const handleAddUom = () => {
    if (!newUomName.trim() || !newUomSymbol.trim()) return;
    addUOM({
      name: newUomName,
      abbreviation: newUomSymbol
    });
    setNewUomName('');
    setNewUomSymbol('');
    toast({ title: 'Unit Added', description: `${newUomName} has been added.` });
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    addStockLocation({
      name: newLocationName,
      address: newLocationAddress,
      isDefault: stockLocations.length === 0
    });
    setNewLocationName('');
    setNewLocationAddress('');
    toast({ title: 'Location Added', description: `${newLocationName} has been added.` });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure your store preferences</p>
          </div>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1 bg-muted/50">
            <TabsTrigger value="organization" className="text-xs sm:text-sm">Organization</TabsTrigger>
            <TabsTrigger value="terminals" className="text-xs sm:text-sm">Terminals</TabsTrigger>
            <TabsTrigger value="uom" className="text-xs sm:text-sm">Units</TabsTrigger>
            <TabsTrigger value="locations" className="text-xs sm:text-sm">Locations</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm">Preferences</TabsTrigger>
          </TabsList>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Store Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName" 
                    value={organization.name}
                    onChange={(e) => updateOrganization({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={organization.phone}
                    onChange={(e) => updateOrganization({ phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={organization.email || ''}
                    onChange={(e) => updateOrganization({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={organization.address}
                    onChange={(e) => updateOrganization({ address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">KRA PIN</Label>
                  <Input 
                    id="pin" 
                    value={organization.kraPin}
                    onChange={(e) => updateOrganization({ kraPin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat">VAT Number</Label>
                  <Input 
                    id="vat" 
                    value={organization.vatNumber}
                    onChange={(e) => updateOrganization({ vatNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select 
                    value={organization.currency}
                    onValueChange={(value) => updateOrganization({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                      <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={organization.timezone}
                    onValueChange={(value) => updateOrganization({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">East Africa (Nairobi)</SelectItem>
                      <SelectItem value="Africa/Lagos">West Africa (Lagos)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">South Africa</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveOrganization} className="gradient-primary">
                  Save Organization Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Terminals Tab */}
          <TabsContent value="terminals" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                POS Terminals
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Terminal name (e.g., POS 1)"
                    value={newTerminalName}
                    onChange={(e) => setNewTerminalName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTerminal}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {terminals.map((terminal) => (
                    <div key={terminal.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{terminal.name}</p>
                        <p className="text-sm text-muted-foreground">{terminal.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          terminal.isActive 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {terminal.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteTerminal(terminal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {terminals.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground">No terminals configured</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Units of Measure Tab */}
          <TabsContent value="uom" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" />
                Units of Measure
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Unit name (e.g., Kilogram)"
                    value={newUomName}
                    onChange={(e) => setNewUomName(e.target.value)}
                    className="flex-1"
                  />
                  <Input 
                    placeholder="Symbol (e.g., kg)"
                    value={newUomSymbol}
                    onChange={(e) => setNewUomSymbol(e.target.value)}
                    className="w-24"
                  />
                  <Button onClick={handleAddUom}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {unitsOfMeasure.map((uom) => (
                    <div 
                      key={uom.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{uom.name}</p>
                        <p className="text-sm text-muted-foreground">{uom.abbreviation}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteUOM(uom.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Stock Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Stock Locations
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Location name (e.g., Main Warehouse)"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="flex-1"
                  />
                  <Input 
                    placeholder="Address"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddLocation}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {stockLocations.map((location) => (
                    <div key={location.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {location.name}
                          {location.isDefault && (
                            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{location.address || 'No address'}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteStockLocation(location.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {stockLocations.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground">No locations configured</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Receipt Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto Print Receipt</p>
                    <p className="text-sm text-muted-foreground">Automatically print after each sale</p>
                  </div>
                  <Switch 
                    checked={autoPrint} 
                    onCheckedChange={(checked) => {
                      setAutoPrint(checked);
                      updateOrganization({ autoPrintReceipt: checked });
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer">Receipt Footer Message</Label>
                  <Input 
                    id="footer" 
                    value={organization.receiptFooter}
                    onChange={(e) => updateOrganization({ receiptFooter: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications & Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Get alerts for low stock items</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={(checked) => {
                      setNotifications(checked);
                      updateOrganization({ lowStockAlerts: checked });
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <div>
                      <p className="font-medium text-foreground">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                    </div>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={(checked) => {
                      setDarkMode(checked);
                      updateOrganization({ darkMode: checked });
                    }} 
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
