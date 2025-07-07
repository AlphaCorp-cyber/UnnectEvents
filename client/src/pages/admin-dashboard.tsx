import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, DollarSign, Key, Shield, Package, Plus, Edit3, Trash2, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import PricingCalculator from "@/components/pricing-calculator";

interface AdminSetting {
  id: number;
  key: string;
  value: string;
  isEncrypted: boolean;
}

interface PaymentSettings {
  isPaidVersion: boolean;
  eventPostingPrice: string;
  paynowMerchantId: string;
  paynowIntegrationId: string;
  paynowIntegrationKey: string;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // OAuth Settings
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [facebookAppId, setFacebookAppId] = useState("");
  const [facebookAppSecret, setFacebookAppSecret] = useState("");
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    isPaidVersion: false,
    eventPostingPrice: "0",
    paynowMerchantId: "",
    paynowIntegrationId: "",
    paynowIntegrationKey: ""
  });

  // Loading states
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingOAuth, setIsSavingOAuth] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Load settings on mount
  useEffect(() => {
    if (user && user.isAdmin) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      
      // Load admin settings (OAuth keys)
      const settingsResponse = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      
      if (settingsResponse.ok) {
        const settings: AdminSetting[] = await settingsResponse.json();
        
        settings.forEach(setting => {
          if (setting.key === 'GOOGLE_CLIENT_ID') setGoogleClientId(setting.value);
          if (setting.key === 'GOOGLE_CLIENT_SECRET') setGoogleClientSecret(setting.value === '[ENCRYPTED]' ? '' : setting.value);
          if (setting.key === 'FACEBOOK_APP_ID') setFacebookAppId(setting.value);
          if (setting.key === 'FACEBOOK_APP_SECRET') setFacebookAppSecret(setting.value === '[ENCRYPTED]' ? '' : setting.value);
        });
      }
      
      // Load payment settings
      const paymentResponse = await fetch('/api/admin/payment-settings', {
        credentials: 'include'
      });
      
      if (paymentResponse.ok) {
        const payment = await paymentResponse.json();
        setPaymentSettings({
          ...payment,
          paynowIntegrationKey: payment.paynowIntegrationKey === '[ENCRYPTED]' ? '' : payment.paynowIntegrationKey
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load admin settings",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveOAuthSettings = async () => {
    try {
      setIsSavingOAuth(true);
      
      const settings = [
        { key: 'GOOGLE_CLIENT_ID', value: googleClientId, isEncrypted: false },
        { key: 'GOOGLE_CLIENT_SECRET', value: googleClientSecret, isEncrypted: true },
        { key: 'FACEBOOK_APP_ID', value: facebookAppId, isEncrypted: false },
        { key: 'FACEBOOK_APP_SECRET', value: facebookAppSecret, isEncrypted: true }
      ];

      for (const setting of settings) {
        if (setting.value.trim()) {
          const response = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(setting)
          });

          if (!response.ok) {
            throw new Error(`Failed to save ${setting.key}`);
          }
        }
      }

      toast({
        title: "Success",
        description: "OAuth settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving OAuth settings:', error);
      toast({
        title: "Error",
        description: "Failed to save OAuth settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingOAuth(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setIsSavingPayment(true);
      
      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save payment settings');
      }

      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <Shield className="inline-block w-8 h-8 mr-3" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage OAuth credentials, payment settings, and platform configuration
          </p>
        </div>

        <Tabs defaultValue="oauth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="oauth" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              OAuth Settings
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Pricing Packages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  OAuth Credentials
                </CardTitle>
                <CardDescription>
                  Configure Google and Facebook OAuth credentials for social login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google OAuth */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Google OAuth</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="googleClientId">Client ID</Label>
                      <Input
                        id="googleClientId"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        placeholder="Your Google Client ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="googleClientSecret">Client Secret</Label>
                      <Input
                        id="googleClientSecret"
                        type="password"
                        value={googleClientSecret}
                        onChange={(e) => setGoogleClientSecret(e.target.value)}
                        placeholder="Your Google Client Secret"
                      />
                    </div>
                  </div>
                </div>

                {/* Facebook OAuth */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Facebook OAuth</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="facebookAppId">App ID</Label>
                      <Input
                        id="facebookAppId"
                        value={facebookAppId}
                        onChange={(e) => setFacebookAppId(e.target.value)}
                        placeholder="Your Facebook App ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebookAppSecret">App Secret</Label>
                      <Input
                        id="facebookAppSecret"
                        type="password"
                        value={facebookAppSecret}
                        onChange={(e) => setFacebookAppSecret(e.target.value)}
                        placeholder="Your Facebook App Secret"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveOAuthSettings} 
                  disabled={isSavingOAuth}
                  className="w-full md:w-auto"
                >
                  {isSavingOAuth ? "Saving..." : "Save OAuth Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure payment settings for event posting and Paynow integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Free/Paid Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Paid Event Posting</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentSettings.isPaidVersion 
                        ? "Users must pay to post events" 
                        : "Event posting is currently free"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.isPaidVersion}
                    onCheckedChange={(checked) => 
                      setPaymentSettings(prev => ({ ...prev, isPaidVersion: checked }))
                    }
                  />
                </div>

                {/* Note about pricing */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Event posting prices are now automatically calculated based on the listing packages you've configured. Users select the number of days for their event listing, and the system calculates the optimal price using your package combinations.
                  </p>
                </div>

                {/* Paynow Settings */}
                {paymentSettings.isPaidVersion && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Paynow Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paynowMerchantId">Merchant ID</Label>
                        <Input
                          id="paynowMerchantId"
                          value={paymentSettings.paynowMerchantId}
                          onChange={(e) => 
                            setPaymentSettings(prev => ({ ...prev, paynowMerchantId: e.target.value }))
                          }
                          placeholder="Your Paynow Merchant ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paynowIntegrationId">Integration ID</Label>
                        <Input
                          id="paynowIntegrationId"
                          value={paymentSettings.paynowIntegrationId}
                          onChange={(e) => 
                            setPaymentSettings(prev => ({ ...prev, paynowIntegrationId: e.target.value }))
                          }
                          placeholder="Your Paynow Integration ID"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="paynowIntegrationKey">Integration Key</Label>
                      <Input
                        id="paynowIntegrationKey"
                        type="password"
                        value={paymentSettings.paynowIntegrationKey}
                        onChange={(e) => 
                          setPaymentSettings(prev => ({ ...prev, paynowIntegrationKey: e.target.value }))
                        }
                        placeholder="Your Paynow Integration Key"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={savePaymentSettings} 
                  disabled={isSavingPayment}
                  className="w-full md:w-auto"
                >
                  {isSavingPayment ? "Saving..." : "Save Payment Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Listing Packages
                </CardTitle>
                <CardDescription>
                  Manage flexible pricing packages for event listings with automatic cost optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingCalculator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}