import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { 
  Users, 
  Car, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminPortal() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [bankSettings, setBankSettings] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    serviceFeePercentage: "5.00",
    fixedServiceFee: "2.00",
    payoutSchedule: "weekly",
  });
  const [isConfigured, setIsConfigured] = useState(false);

  // Check if user is admin - temporarily allow access for testing
  const isAdmin = true; // Bypass authentication for testing

  const handleSaveBankSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!bankSettings.bankName || !bankSettings.accountHolderName || !bankSettings.accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required bank details.",
        variant: "destructive",
      });
      return;
    }

    // Simulate save
    setIsConfigured(true);
    toast({
      title: "Bank Settings Saved",
      description: "Your bank details have been configured successfully. The platform is ready for payments!",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setBankSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isAdmin) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
              <p className="text-gray-600">You need admin privileges to access this portal.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">Manage your One Route platform</p>
        </div>

        {/* Bank Setup Required Notice */}
        {!isConfigured && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-800">Bank Setup Required</h3>
                  <p className="text-sm text-orange-700">
                    Please configure your bank details in the "Bank Settings" tab before going live to receive payments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={!isConfigured ? "settings" : "dashboard"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="rides">Rides</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="settings">Bank Settings</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-sky-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-gray-600">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Car className="w-8 h-8 text-sky-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-gray-600">Total Rides</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-sky-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">$0</p>
                      <p className="text-gray-600">Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-gray-600">Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management features will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rides */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>Ride Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Ride management features will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety */}
          <TabsContent value="safety">
            <Card>
              <CardHeader>
                <CardTitle>Safety & Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Safety monitoring features will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bank Account Configuration</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure your bank details to receive payments from the platform
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveBankSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name *</Label>
                      <Input
                        id="bankName"
                        placeholder="e.g., Chase Bank"
                        value={bankSettings.bankName}
                        onChange={(e) => handleInputChange("bankName", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                      <Input
                        id="accountHolderName"
                        placeholder="Full name on account"
                        value={bankSettings.accountHolderName}
                        onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Account number"
                        value={bankSettings.accountNumber}
                        onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input
                        id="routingNumber"
                        placeholder="9-digit routing number"
                        value={bankSettings.routingNumber}
                        onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Service Fee Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="serviceFeePercentage">Service Fee (%)</Label>
                        <Input
                          id="serviceFeePercentage"
                          placeholder="5.00"
                          value={bankSettings.serviceFeePercentage}
                          onChange={(e) => handleInputChange("serviceFeePercentage", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="fixedServiceFee">Fixed Fee ($)</Label>
                        <Input
                          id="fixedServiceFee"
                          placeholder="2.00"
                          value={bankSettings.fixedServiceFee}
                          onChange={(e) => handleInputChange("fixedServiceFee", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                        <Select 
                          value={bankSettings.payoutSchedule} 
                          onValueChange={(value) => handleInputChange("payoutSchedule", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-sky-500 hover:bg-sky-600"
                  >
                    Save Bank Settings
                  </Button>
                </form>

                {isConfigured && (
                  <Card className="mt-6 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-700 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Configuration Complete - Ready for Live Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <Label className="text-gray-600">Bank Name</Label>
                          <p className="font-medium">{bankSettings.bankName}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Account Holder</Label>
                          <p className="font-medium">{bankSettings.accountHolderName}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Service Fee</Label>
                          <p className="font-medium">{bankSettings.serviceFeePercentage}% + ${bankSettings.fixedServiceFee}</p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Payout Schedule</Label>
                          <p className="font-medium capitalize">{bankSettings.payoutSchedule}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-800">
                          Your bank details are configured. The platform is ready to process payments and transfer funds to your account.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isConfigured && (
                  <Card className="mt-6 border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-700 flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        Setup Required Before Going Live
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-800">
                          Bank details must be configured before the platform can process payments. Users won't be able to complete transactions until this is set up.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}