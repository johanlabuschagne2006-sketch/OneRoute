import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Phone, Shield, MessageSquare } from "lucide-react";

export default function OTPVerification() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  const sendOtpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/send-otp", { phone }),
    onSuccess: () => {
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phone}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/verify-otp", { phone, otp }),
    onSuccess: () => {
      toast({
        title: "Phone Verified",
        description: "Your phone number has been successfully verified!",
      });
      // Redirect or update user state
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-600" />
          </div>
          <CardTitle>Phone Verification</CardTitle>
          <CardDescription>
            Verify your phone number to enable emergency features and secure communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={() => sendOtpMutation.mutate()}
                disabled={!phone || sendOtpMutation.isPending}
                className="w-full bg-sky-600 hover:bg-sky-700"
              >
                {sendOtpMutation.isPending ? "Sending..." : "Send Verification Code"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-10 text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to {phone}
                </p>
              </div>
              <Button
                onClick={() => verifyOtpMutation.mutate()}
                disabled={otp.length !== 6 || verifyOtpMutation.isPending}
                className="w-full bg-sky-600 hover:bg-sky-700"
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify Phone"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}