import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Smartphone,
  Mail,
  Globe,
  Plus,
  Trash2,
  Eye
} from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: "card", last4: "4242", brand: "Visa", isDefault: true },
    { id: 2, type: "card", last4: "5555", brand: "Mastercard", isDefault: false },
  ]);

  // User profile form
  const profileForm = useForm({
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      email: (user as any)?.email || "",
      phone: (user as any)?.phone || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  // Bypass authentication for testing
  const allowAccess = true;
  
  if (!allowAccess) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600">Please log in to access your settings.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-sky-500 hover:bg-sky-600"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive ride updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Receive ride updates via SMS</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-600">Receive push notifications</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-gray-600">Receive promotional emails</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-gray-600">Show your profile to other users</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Location Sharing</Label>
                  <p className="text-sm text-gray-600">Share location during rides</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ride History</Label>
                  <p className="text-sm text-gray-600">Allow others to see your ride history</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Account & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Methods
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Payment Methods</DialogTitle>
                    <DialogDescription>
                      Manage your payment methods for rides and subscriptions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="cards" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="cards">Cards</TabsTrigger>
                      <TabsTrigger value="add">Add New</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="cards" className="space-y-4">
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">No payment methods added yet</p>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              // Switch to add tab
                              const addTab = document.querySelector('[value="add"]') as HTMLElement;
                              addTab?.click();
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Payment Method
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <Card key={method.id} className={method.isDefault ? "border-sky-500 bg-sky-50" : ""}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <CreditCard className="w-6 h-6 text-gray-600" />
                                    <div>
                                      <p className="font-medium">
                                        {method.brand} ending in {method.last4}
                                      </p>
                                      {method.isDefault && (
                                        <p className="text-sm text-sky-600">Default payment method</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {!method.isDefault && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          const updated = paymentMethods.map(pm => ({
                                            ...pm,
                                            isDefault: pm.id === method.id
                                          }));
                                          setPaymentMethods(updated);
                                          toast({
                                            title: "Default Updated",
                                            description: `${method.brand} ending in ${method.last4} is now your default payment method.`,
                                          });
                                        }}
                                      >
                                        Set Default
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const updated = paymentMethods.filter(pm => pm.id !== method.id);
                                        setPaymentMethods(updated);
                                        toast({
                                          title: "Payment Method Removed",
                                          description: `${method.brand} ending in ${method.last4} has been removed.`,
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="add" className="space-y-4">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target as HTMLFormElement);
                          const cardNumber = formData.get("cardNumber") as string;
                          const last4 = cardNumber.slice(-4);
                          const brand = cardNumber.startsWith("4") ? "Visa" : 
                                       cardNumber.startsWith("5") ? "Mastercard" : "Card";
                          
                          const newMethod = {
                            id: paymentMethods.length + 1,
                            type: "card",
                            last4,
                            brand,
                            isDefault: paymentMethods.length === 0
                          };
                          
                          setPaymentMethods([...paymentMethods, newMethod]);
                          toast({
                            title: "Payment Method Added",
                            description: `${brand} ending in ${last4} has been added successfully.`,
                          });
                          
                          // Reset form
                          (e.target as HTMLFormElement).reset();
                          
                          // Switch back to cards tab
                          const cardsTab = document.querySelector('[value="cards"]') as HTMLElement;
                          cardsTab?.click();
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            onChange={(e) => {
                              // Auto-format card number
                              let value = e.target.value.replace(/\D/g, '');
                              value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                              e.target.value = value;
                            }}
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              name="expiry"
                              placeholder="MM/YY"
                              maxLength={5}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.substring(0,2) + '/' + value.substring(2,4);
                                }
                                e.target.value = value;
                              }}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input
                              id="cvc"
                              name="cvc"
                              placeholder="123"
                              maxLength={4}
                              onChange={(e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                              }}
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="cardholderName">Cardholder Name</Label>
                          <Input
                            id="cardholderName"
                            name="cardholderName"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        
                        <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Language & Region
              </Button>

              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <Shield className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}