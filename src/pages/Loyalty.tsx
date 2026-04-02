import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCustomerStore } from '@/store/customerStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { 
  Award, 
  CreditCard, 
  Gift, 
  Settings, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';

export default function Loyalty() {
  const [searchTerm, setSearchTerm] = useState('');
  const [redeemCardNumber, setRedeemCardNumber] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  
  const { cards, transactions, getCard, redeemPoints: processRedeem } = useLoyaltyStore();
  const { loyaltySettings, updateLoyaltySettings } = useSettingsStore();
  const { redeemLoyaltyPoints } = useCustomerStore();
  const { toast } = useToast();

  const filteredCards = cards.filter(
    (c) =>
      c.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPoints = cards.reduce((sum, c) => sum + c.points, 0);
  const totalRedeemed = transactions
    .filter((t) => t.type === 'redeem')
    .reduce((sum, t) => sum + t.points, 0);

  const handleRedeem = () => {
    const card = getCard(redeemCardNumber);
    if (!card) {
      toast({ title: 'Error', description: 'Card not found', variant: 'destructive' });
      return;
    }
    
    const points = parseInt(redeemPoints);
    if (points < loyaltySettings.minRedeemPoints) {
      toast({ 
        title: 'Error', 
        description: `Minimum ${loyaltySettings.minRedeemPoints} points required`, 
        variant: 'destructive' 
      });
      return;
    }

    if (processRedeem(card.id, card.customerId, points, 'Manual redemption')) {
      redeemLoyaltyPoints(card.customerId, points);
      toast({ 
        title: 'Success', 
        description: `${points} points redeemed worth ${formatKES(points * loyaltySettings.redeemPointValue)}` 
      });
      setRedeemCardNumber('');
      setRedeemPoints('');
    } else {
      toast({ title: 'Error', description: 'Insufficient points', variant: 'destructive' });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500';
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      default: return 'bg-amber-700';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Award className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loyalty Management</h1>
            <p className="text-muted-foreground">Manage loyalty cards and rewards</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Gift className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Redeemed</p>
                <p className="text-2xl font-bold">{totalRedeemed.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Award className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Point Value</p>
                <p className="text-2xl font-bold">{formatKES(totalPoints * loyaltySettings.redeemPointValue)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Loyalty Cards</TabsTrigger>
            <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Loyalty Cards</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {cards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No loyalty cards yet</p>
                  <p className="text-sm">Cards are created automatically when adding customers</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 rounded-xl text-white ${getTierColor(card.tier)}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm opacity-80">Loyalty Card</p>
                          <p className="font-mono text-lg">{card.cardNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-white border-white capitalize">
                          {card.tier}
                        </Badge>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm opacity-80">Customer</p>
                        <p className="font-semibold">{card.customerName}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm opacity-80">Points</p>
                          <p className="text-2xl font-bold">{card.points.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-80">Value</p>
                          <p className="font-semibold">{formatKES(card.points * loyaltySettings.redeemPointValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="redeem">
            <Card className="p-6 max-w-md">
              <h2 className="text-xl font-semibold mb-4">Redeem Points</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    value={redeemCardNumber}
                    onChange={(e) => setRedeemCardNumber(e.target.value)}
                    placeholder="Enter card number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Points to Redeem</Label>
                  <Input
                    type="number"
                    min={loyaltySettings.minRedeemPoints}
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    placeholder={`Minimum ${loyaltySettings.minRedeemPoints}`}
                  />
                </div>
                {redeemPoints && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Redemption Value</p>
                    <p className="text-xl font-bold">{formatKES(parseInt(redeemPoints || '0') * loyaltySettings.redeemPointValue)}</p>
                  </div>
                )}
                <Button onClick={handleRedeem} className="w-full">
                  <Gift className="w-4 h-4 mr-2" />
                  Redeem Points
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice().reverse().slice(0, 50).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'earn' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {tx.type === 'earn' ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'earn' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Loyalty Settings</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Points per KES spent</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">1 point per</span>
                    <Input
                      type="number"
                      min="1"
                      value={loyaltySettings.pointsPerAmount}
                      onChange={(e) => updateLoyaltySettings({ pointsPerAmount: parseInt(e.target.value) || 100 })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">KES</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Point Redemption Value</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">1 point =</span>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={loyaltySettings.redeemPointValue}
                      onChange={(e) => updateLoyaltySettings({ redeemPointValue: parseFloat(e.target.value) || 1 })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">KES</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Redeem Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={loyaltySettings.minRedeemPoints}
                    onChange={(e) => updateLoyaltySettings({ minRedeemPoints: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Silver Tier Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    value={loyaltySettings.tierThresholds.silver}
                    onChange={(e) => updateLoyaltySettings({ 
                      tierThresholds: { ...loyaltySettings.tierThresholds, silver: parseInt(e.target.value) || 1000 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gold Tier Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    value={loyaltySettings.tierThresholds.gold}
                    onChange={(e) => updateLoyaltySettings({ 
                      tierThresholds: { ...loyaltySettings.tierThresholds, gold: parseInt(e.target.value) || 5000 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Platinum Tier Threshold</Label>
                  <Input
                    type="number"
                    min="0"
                    value={loyaltySettings.tierThresholds.platinum}
                    onChange={(e) => updateLoyaltySettings({ 
                      tierThresholds: { ...loyaltySettings.tierThresholds, platinum: parseInt(e.target.value) || 10000 }
                    })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
