import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera,
  FileText,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface IdVerification {
  id: string;
  documentType: string;
  documentUrl: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function IdVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch user's ID verifications
  const { data: verifications = [] } = useQuery<IdVerification[]>({
    queryKey: ["/api/verify/status"],
  });

  // Upload verification mutation
  const uploadVerificationMutation = useMutation({
    mutationFn: async (data: { documentType: string; documentUrl: string }) =>
      apiRequest("POST", "/api/verify/upload", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verify/status"] });
      setDocumentType("");
      setSelectedFile(null);
      toast({
        title: "Document Uploaded",
        description: "Your ID verification has been submitted for review",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    setUploading(true);
    try {
      // Convert file to base64 for simple upload
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        uploadVerificationMutation.mutate({
          documentType,
          documentUrl: base64, // In production, you'd upload to cloud storage
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Shield className="w-8 h-8 text-sky-600" />
          <span>ID Verification</span>
        </h1>
        <p className="text-muted-foreground">
          Verify your identity to unlock all features and build trust with other users
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload New Document */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload New Document</span>
            </CardTitle>
            <CardDescription>
              Upload a clear photo of your government-issued ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Document Type
              </label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drivers_license">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Driver's License</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="passport">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Passport</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="national_id">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>National ID Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="state_id">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>State ID Card</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Document Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="space-y-2">
                    <Camera className="w-8 h-8 mx-auto text-green-600" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      onClick={() => setSelectedFile(null)}
                      variant="outline"
                      size="sm"
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Tips for best results:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Ensure the document is well-lit and in focus</li>
                  <li>• Include all four corners of the document</li>
                  <li>• Avoid glare or shadows on the document</li>
                  <li>• Use a dark background for contrast</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentType || uploading || uploadVerificationMutation.isPending}
              className="w-full bg-sky-600 hover:bg-sky-700"
            >
              {uploading || uploadVerificationMutation.isPending ? "Uploading..." : "Submit for Verification"}
            </Button>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Verification History</span>
            </CardTitle>
            <CardDescription>
              Track the status of your ID verification submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No verifications submitted yet</p>
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">
                          {verification.documentType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Submitted {format(new Date(verification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(verification.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(verification.status)}
                          <span className="capitalize">{verification.status}</span>
                        </div>
                      </Badge>
                    </div>

                    {verification.reviewNotes && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm font-medium mb-1">Review Notes:</p>
                        <p className="text-sm text-muted-foreground">
                          {verification.reviewNotes}
                        </p>
                      </div>
                    )}

                    {verification.reviewedAt && (
                      <div className="text-xs text-muted-foreground">
                        Reviewed {format(new Date(verification.reviewedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benefits of Verification */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Benefits of ID Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-sky-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Enhanced Trust</h4>
                <p className="text-muted-foreground">
                  Verified users are more likely to be chosen for rides
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-muted-foreground">
                  Get faster response times for customer support
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Payment Features</h4>
                <p className="text-muted-foreground">
                  Access advanced payment and earning features
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}