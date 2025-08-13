import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Shield, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import type { IdVerification, User } from "@shared/schema";

export default function IDVerification() {
  const [documentType, setDocumentType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth() as { user: User };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's ID verifications
  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["/api/id-verification", user?.id],
    enabled: !!user?.id,
  });

  // Submit ID verification
  const submitVerificationMutation = useMutation({
    mutationFn: async (verificationData: { documentType: string; documentUrl: string }) => {
      return apiRequest("POST", "/api/id-verification", verificationData);
    },
    onSuccess: () => {
      toast({
        title: "ID Verification Submitted",
        description: "Your ID document has been submitted for review. You'll be notified once it's processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/id-verification", user?.id] });
      setSelectedFile(null);
      setDocumentType("");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit ID verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG, PNG, or PDF file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!documentType || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select a document type and upload a file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you'd upload to a secure file storage service
      // For now, we'll simulate the upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);

      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockDocumentUrl = `https://documents.oneroute.com/${user?.id}/${documentType}_${Date.now()}.${selectedFile.type.split('/')[1]}`;

      await submitVerificationMutation.mutateAsync({
        documentType,
        documentUrl: mockDocumentUrl,
      });
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
  };

  const latestVerification = (verifications as IdVerification[])?.[0];
  const isVerified = latestVerification?.status === "approved";

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-sky-600" />
            ID Verification Status
          </CardTitle>
          <CardDescription>
            ID verification helps build trust and ensures safer rides for everyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (verifications as IdVerification[])?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No ID verification submitted yet</p>
              <p className="text-sm text-gray-500">Upload your ID to get verified and unlock premium features</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(verifications as IdVerification[]).map((verification) => (
                <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(verification.status || '')}
                    <div>
                      <p className="font-medium capitalize">
                        {verification.documentType.replace("_", " ")}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted {verification.createdAt ? new Date(verification.createdAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                      {verification.reviewNotes && verification.status === "rejected" && (
                        <p className="text-sm text-red-600 mt-1">{verification.reviewNotes}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(verification.status || '')}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload New Document */}
      {!isVerified && (
        <Card>
          <CardHeader>
            <CardTitle>Upload ID Document</CardTitle>
            <CardDescription>
              Upload a clear photo of your government-issued ID (passport, driver's license, or national ID).
              Files must be under 5MB and in JPEG, PNG, or PDF format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">Driver's License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Document File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="document"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="document"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : "Click to upload document"}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, or PDF up to 5MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!documentType || !selectedFile || isUploading || submitVerificationMutation.isPending}
              className="w-full bg-sky-500 hover:bg-sky-600"
            >
              {isUploading || submitVerificationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Verified Badge</p>
                <p className="text-sm text-gray-600">Show other users you're trustworthy</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Priority Support</p>
                <p className="text-sm text-gray-600">Get faster response times</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Higher Limits</p>
                <p className="text-sm text-gray-600">Access to premium ride features</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Better Matches</p>
                <p className="text-sm text-gray-600">Preferred in ride matching</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}