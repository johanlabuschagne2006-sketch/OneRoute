import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCapacitor } from "@/hooks/useCapacitor";
import Messages from "@/pages/messages";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import RideHistory from "@/pages/ride-history";
import PaymentPage from "@/pages/payment";
import AdminPortal from "@/pages/admin-simple";
import Admin from "@/pages/admin";
import Settings from "@/pages/settings";
import Emergency from "@/pages/emergency";
import OTPVerification from "@/pages/otp-verification";
import IdVerification from "@/pages/id-verification";
import GPSDemo from "@/pages/gps-demo";
import TestAll from "@/pages/test-all";
import MobileGPS from "@/pages/mobile-gps";
import PayPalButton from "@/components/PayPalButton";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isNative, platform } = useCapacitor();

  return (
    <Switch>
      {/* Routes accessible without authentication */}
      <Route path="/admin-simple" component={AdminPortal} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/messages" component={Messages} />
          <Route path="/chat/:rideId" component={Chat} />
          <Route path="/profile" component={Profile} />
          <Route path="/history" component={RideHistory} />
          <Route path="/payment/:rideId" component={PaymentPage} />
          <Route path="/settings" component={Settings} />
          <Route path="/emergency" component={Emergency} />
          <Route path="/verify-otp" component={OTPVerification} />
          <Route path="/verify-id" component={IdVerification} />
          <Route path="/admin" component={Admin} />
          <Route path="/gps-demo" component={GPSDemo} />
          <Route path="/mobile-gps" component={MobileGPS} />
          <Route path="/test-all" component={TestAll} />
          <Route path="/paypal-demo" component={() => (
            <div className="min-h-screen bg-gray-50 p-8">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-sky-600">PayPal Payment Demo</h1>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Sample Ride Payment</h2>
                  <div className="mb-6 p-4 bg-sky-50 rounded-lg">
                    <p className="mb-2"><strong>Route:</strong> Downtown → Airport</p>
                    <p className="mb-2"><strong>Date:</strong> Tomorrow 2:00 PM</p>
                    <p className="mb-2"><strong>Driver:</strong> John Smith</p>
                    <p className="text-xl font-bold text-green-600"><strong>Price:</strong> $25.00</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Pay securely with PayPal or credit card
                    </p>
                    <PayPalButton amount="25.00" currency="USD" intent="CAPTURE" />
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>Demo mode - requires PayPal API credentials to process real payments</p>
                  </div>
                </div>
              </div>
            </div>
          )} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
