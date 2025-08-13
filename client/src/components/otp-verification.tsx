import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Phone } from "lucide-react";

interface OTPVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function OTPVerification({ phoneNumber, onVerified, onCancel }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await apiRequest("POST", "/api/auth/verify-otp", {
        phone: phoneNumber,
        otp: otp,
      });

      toast({
        title: "Phone Verified!",
        description: "Your phone number has been successfully verified.",
      });
      onVerified();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await apiRequest("POST", "/api/auth/send-otp", {
        phone: phoneNumber,
      });

      toast({
        title: "OTP Sent",
        description: "A new OTP code has been sent to your phone.",
      });
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-6 h-6 text-sky-600" />
        </div>
        <CardTitle>Verify Your Phone</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to {phoneNumber}. Enter it below to verify your phone number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6 || isVerifying}
            className="w-full bg-sky-500 hover:bg-sky-600"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Phone Number"
            )}
          </Button>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-sky-600 hover:text-sky-700"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend OTP"
              )}
            </Button>

            <Button variant="ghost" onClick={onCancel} className="text-gray-500">
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}