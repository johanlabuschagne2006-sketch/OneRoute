import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Car,
  User,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import PayPalButton from "@/components/PayPalButton";

interface RideDetails {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  price: string;
  status: string;
  driver: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
  };
}

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  rideId: string;
}

export default function Payment() {
  const [match, params] = useRoute('/payment/:rideId');
  const rideId = (params as any)?.rideId;
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch ride details
  const { data: ride } = useQuery<RideDetails>({
    queryKey: ["/api/rides", rideId],
    enabled: !!rideId,
  });

  // Fetch payment transactions
  const { data: transactions = [] } = useQuery<PaymentTransaction[]>({
    queryKey: ["/api/payment/transactions"],
  });

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: (amount: number) => 
      apiRequest("POST", "/api/payment/create-intent", { amount, rideId }),
    onSuccess: (data: any) => {
      if (data?.success) {
        toast({
          title: "Payment Successful!",
          description: `Ride booked successfully! ${data?.creditsUsed || 0} credits used. You have ${data?.remainingCredits || 0} credits remaining.`,
        });
        // Redirect to ride details or home
        window.location.href = "/";
      } else {
        toast({
          title: "Payment Failed",
          description: data?.message || "Insufficient credits for this ride.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!ride) return;
    
    setIsProcessing(true);
    const ridePrice = parseFloat(ride.price);
    const serviceFee = 2.00;
    const totalAmount = ridePrice + serviceFee;
    
    createPaymentMutation.mutate(totalAmount);
    
    // Reset processing state after a delay
    setTimeout(() => setIsProcessing(false), 3000);
  };

  if (!ride) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading ride details...</div>
      </div>
    );
  }

  const ridePrice = parseFloat(ride.price);
  const serviceFee = 2.00;
  const totalAmount = ridePrice + serviceFee;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <CreditCard className="w-8 h-8 text-sky-600" />
          <span>Ride Payment</span>
        </h1>
        <p className="text-muted-foreground">
          Secure payment processing for your ride booking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="w-5 h-5" />
              <span>Ride Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">From:</span>
                <span className="text-sm">{ride.origin}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">To:</span>
                <span className="text-sm">{ride.destination}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">
                  {format(new Date(ride.departureDate), "PPp")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Driver:</span>
                <span className="text-sm">
                  {ride.driver.firstName} {ride.driver.lastName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vehicle:</span>
                <span className="text-sm">
                  {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                </span>
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium">Price Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Ride fare</span>
                  <span>{Math.ceil(ridePrice)} credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee</span>
                  <span>{Math.ceil(serviceFee)} credits</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{Math.ceil(totalAmount)} credits</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Payment Information</span>
            </CardTitle>
            <CardDescription>
              Your payment information is secure and encrypted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PayPal Payment Integration */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>PayPal Payment:</strong> Secure payment processing with PayPal. 
                The admin receives their percentage automatically, and drivers get paid directly.
              </AlertDescription>
            </Alert>

            {/* PayPal Button Container */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950 rounded-lg">
              <div className="text-center">
                <h4 className="font-medium mb-2">Pay with PayPal</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Secure payment with your PayPal account or credit card
                </p>
                
                {/* PayPal Button Component */}
                <PayPalButton 
                  amount="25.00" 
                  currency="USD" 
                  intent="CAPTURE" 
                />
              </div>
            </div>

            {/* Payment Info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>How payment works:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Pay securely with PayPal or credit card</li>
                <li>• Admin receives their percentage automatically</li>
                <li>• Driver gets paid directly after ride completion</li>
                <li>• All transactions are secured by PayPal</li>
              </ul>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || createPaymentMutation.isPending}
              className="w-full bg-sky-600 hover:bg-sky-700 h-12 text-lg"
            >
              {isProcessing || createPaymentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay {Math.ceil(totalAmount)} Credits
                </>
              )}
            </Button>

            {/* Credit System Notice */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Credit-based system • No real money transactions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {transactions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Payment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      Ride Payment - ${transaction.amount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(transaction.createdAt), "PPp")}
                    </div>
                  </div>
                  <Badge
                    variant={
                      transaction.status === "completed" ? "default" : "secondary"
                    }
                  >
                    <div className="flex items-center space-x-1">
                      {transaction.status === "completed" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span className="capitalize">{transaction.status}</span>
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}