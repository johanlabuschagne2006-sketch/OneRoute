import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  ShieldCheck, 
  Settings, 
  AlertTriangle, 
  Car,
  CreditCard,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  suspended: boolean;
  createdAt: string;
  profileImageUrl?: string;
}

interface IdVerification {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
  user?: User;
}

interface AdminSettings {
  id: string;
  adminId: string;
  paypalEmail: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalEnvironment: string;
  commissionRate: number;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [selectedVerification, setSelectedVerification] = useState<IdVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  
  // Admin settings form state
  const [settingsForm, setSettingsForm] = useState({
    paypalEmail: "",
    paypalClientId: "",
    paypalClientSecret: "",
    paypalEnvironment: "sandbox",
    commissionRate: 10,
  });

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch pending ID verifications
  const { data: verifications = [] } = useQuery<IdVerification[]>({
    queryKey: ["/api/admin/verifications"],
  });

  // Fetch admin settings
  const { data: adminSettings } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // User suspension mutation
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, suspended }: { userId: string; suspended: boolean }) =>
      apiRequest("PUT", `/api/admin/users/${userId}/suspend`, { suspended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User status has been updated successfully",
      });
    },
  });

  // Verification review mutation
  const reviewVerificationMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      apiRequest("PUT", `/api/admin/verifications/${id}`, { 
        status, 
        reviewNotes: notes 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      setSelectedVerification(null);
      setReviewNotes("");
      toast({
        title: "Verification Reviewed",
        description: "ID verification has been processed successfully",
      });
    },
  });

  // Admin settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => {
      if (adminSettings) {
        return apiRequest("PUT", "/api/admin/settings", settings);
      } else {
        return apiRequest("POST", "/api/admin/settings", settings);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Admin settings have been saved successfully",
      });
    },
  });

  const handleVerificationReview = (verification: IdVerification) => {
    setSelectedVerification(verification);
    setReviewNotes("");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  // Check if user is admin
  const isAdmin = (user as any)?.email === "admin@oneroute.com" || (user as any)?.id === "admin";

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto p-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, verifications, and system settings</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="verifications" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">ID Verifications</span>
            <span className="sm:hidden">Verify</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage registered users and their account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.phoneVerified ? "default" : "secondary"}>
                            {user.phoneVerified ? "Phone Verified" : "Phone Pending"}
                          </Badge>
                          {user.suspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </span>
                      <Button
                        onClick={() =>
                          suspendUserMutation.mutate({
                            userId: user.id,
                            suspended: !user.suspended,
                          })
                        }
                        disabled={suspendUserMutation.isPending}
                        variant={user.suspended ? "default" : "destructive"}
                        size="sm"
                      >
                        {user.suspended ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Unsuspend
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Suspend
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ID Verifications Tab */}
        <TabsContent value="verifications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Pending Verifications</span>
                </CardTitle>
                <CardDescription>
                  Review and approve user ID verification submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No pending verifications
                    </div>
                  ) : (
                    verifications.map((verification) => (
                      <div
                        key={verification.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {verification.user?.firstName} {verification.user?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {verification.documentType}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Submitted {format(new Date(verification.createdAt), "PPp")}
                        </div>
                        <Button
                          onClick={() => handleVerificationReview(verification)}
                          size="sm"
                          className="w-full"
                        >
                          Review Document
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification Review Panel */}
            {selectedVerification && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Verification</CardTitle>
                  <CardDescription>
                    {selectedVerification.user?.firstName} {selectedVerification.user?.lastName} - {selectedVerification.documentType}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <img
                      src={selectedVerification.documentUrl}
                      alt="ID Document"
                      className="w-full max-w-md mx-auto rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Review Notes
                    </label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about this verification..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        reviewVerificationMutation.mutate({
                          id: selectedVerification.id,
                          status: "approved",
                          notes: reviewNotes,
                        })
                      }
                      disabled={reviewVerificationMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        reviewVerificationMutation.mutate({
                          id: selectedVerification.id,
                          status: "rejected",
                          notes: reviewNotes,
                        })
                      }
                      disabled={reviewVerificationMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  <Button
                    onClick={() => setSelectedVerification(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>PayPal Payment Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your PayPal account and commission rates for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      PayPal Email Address
                    </label>
                    <Input
                      type="email"
                      value={settingsForm.paypalEmail}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, paypalEmail: e.target.value })
                      }
                      placeholder="your-email@paypal.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The email address associated with your PayPal account
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Commission Rate (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={settingsForm.commissionRate}
                      onChange={(e) =>
                        setSettingsForm({ 
                          ...settingsForm, 
                          commissionRate: parseFloat(e.target.value) 
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      PayPal Client ID
                    </label>
                    <Input
                      value={settingsForm.paypalClientId}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, paypalClientId: e.target.value })
                      }
                      placeholder="Enter PayPal Client ID"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get this from your PayPal Developer Dashboard
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      PayPal Client Secret
                    </label>
                    <Input
                      type="password"
                      value={settingsForm.paypalClientSecret}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, paypalClientSecret: e.target.value })
                      }
                      placeholder="Enter PayPal Client Secret"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep this secret - get it from your PayPal Developer Dashboard
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Environment
                  </label>
                  <select 
                    value={settingsForm.paypalEnvironment}
                    onChange={(e) => setSettingsForm({...settingsForm, paypalEnvironment: e.target.value})}
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use sandbox for testing, production for real payments
                  </p>
                </div>
                <Separator />
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}