"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  validateSecureLink, 
  authenticateSecureLink, 
  uploadThroughSecureLink,
  type SecureLinkValidation,
  type SecureLinkAuth
} from "@/lib/api/secure-link-api";
import { 
  uploadFileToS3ForSecureLink, 
  validateSecureUploadFile, 
  formatFileSize 
} from "@/lib/helpers/secure-upload";
import { 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff 
} from "lucide-react";

export default function SecureUploadPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;

  // States
  const [step, setStep] = useState<'validating' | 'password' | 'upload' | 'success' | 'error'>('validating');
  const [linkData, setLinkData] = useState<SecureLinkValidation | null>(null);
  const [authData, setAuthData] = useState<SecureLinkAuth | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Validate link on mount
  useEffect(() => {
    const validateLink = async () => {
      try {
        const validation = await validateSecureLink(token);
        setLinkData(validation);
        if (validation?.requires_signup) {
          const nextUrl = encodeURIComponent(`/secure-upload/${token}`);
          router.replace(`/signup?next=${nextUrl}`);
          return;
        }
        setStep('password');
      } catch (error: any) {
        setError(error.message || 'Invalid or expired link');
        setStep('error');
      }
    };

    if (token) {
      validateLink();
    }
  }, [token, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the password provided by your lawyer",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAuthenticating(true);
      setPasswordError(null);
      const auth = await authenticateSecureLink(token, password);
      setAuthData(auth);
      setStep('upload');
      toast({
        title: "Authentication Successful",
        description: "You can now upload your document",
        variant: "default",
      });
    } catch (error: any) {
      if (error?.status === 401) {
        const nextUrl = encodeURIComponent(`/secure-upload/${token}`);
        router.push(`/login?next=${nextUrl}`);
        return;
      }
      const message = error.message || "Incorrect password";
      setPasswordError(message);
      toast({
        title: "Authentication Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    const validFiles: File[] = [];
    for (const file of incomingFiles) {
      const validation = validateSecureUploadFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
  };

  // Upload file to S3 using the helper function
  const uploadFileToS3 = async (file: File): Promise<string> => {
    return uploadFileToS3ForSecureLink(file, (progress) => {
      setUploadProgress(progress);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !authData) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      let completedCount = 0;

      for (const file of selectedFiles) {
        setUploadingFileName(file.name);
        setUploadProgress(0);
        const fileUrl = await uploadFileToS3(file);

        await uploadThroughSecureLink(
          authData.upload_token,
          fileUrl,
          file.name,
          file.size
        );

        completedCount += 1;
        setUploadedCount(completedCount);
      }

      setStep('success');
      toast({
        title: "Upload Successful",
        description:
          selectedFiles.length > 1
            ? `${selectedFiles.length} documents uploaded and shared with your lawyer`
            : "Your document has been uploaded and shared with your lawyer",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderValidatingStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Validating Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-600">
          Please wait while we validate your secure upload link...
        </p>
      </CardContent>
    </Card>
  );

  const renderPasswordStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Secure Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        {linkData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>From:</strong> {linkData.lawyer_name}<br />
              <strong>For:</strong> {linkData.client_name}<br />
              <strong>Expires:</strong> {new Date(linkData.expires_at).toLocaleString()}
            </p>
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Enter Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password provided by your lawyer"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button type="submit" disabled={isAuthenticating || !password.trim()} className="w-full">
            {isAuthenticating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Authenticate
              </>
            )}
          </Button>
          {passwordError ? (
            <p className="text-sm text-red-600">{passwordError}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );

  const renderUploadStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {authData && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Authenticated for:</strong> {authData.client_name}<br />
              <strong>Lawyer:</strong> {authData.lawyer_name}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="file">Select Document</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500">
            Supported formats: PDF, Word documents, Images (Max 10MB each)
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              {selectedFiles.map((file) => (
                <div className="flex items-center gap-2" key={`${file.name}-${file.size}`}>
                  <FileText className="h-4 w-4" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                {selectedFiles.length} file(s) selected
              </p>
            </div>
          </div>
        )}

        {isUploading ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Uploading{uploadingFileName ? `: ${uploadingFileName}` : "..."}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        ) : null}

        <Button 
          onClick={handleUpload} 
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          Upload Successful
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            {uploadedCount > 1
              ? `${uploadedCount} documents were uploaded successfully and shared with your lawyer.`
              : "Your document has been uploaded successfully and shared with your lawyer."}
          </p>
          <p className="text-xs text-green-700 mt-2">
            This secure link can still be used until its expiry time.
          </p>
        </div>
        <Button onClick={() => router.push('/')} className="w-full">
          Close
        </Button>
      </CardContent>
    </Card>
  );

  const renderErrorStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          Link Error
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'This link is invalid, expired, or has already been used.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')} variant="outline" className="w-full">
          Go to Homepage
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Secure Document Upload
          </h1>
          <p className="text-gray-600">
            Upload your document securely using the link provided by your lawyer
          </p>
        </div>

        {step === 'validating' && renderValidatingStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'upload' && renderUploadStep()}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}
      </div>
    </div>
  );
}
