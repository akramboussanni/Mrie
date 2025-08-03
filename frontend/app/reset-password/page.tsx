'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const email = searchParams.get('email');



  useEffect(() => {
    document.title = "reset password - mrie";
  }, []);

  // Redirect if no token or email
  useEffect(() => {
    if (!token || !email) {
      toast({
        title: "invalid reset link",
        description: "please use the link from your email",
        variant: "destructive",
      });
      router.push('/forgot-password');
    }
  }, [token, email, router, toast]);

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword || isLoading) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "passwords don't match",
        description: "please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "password too short",
        description: "password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword({
        token: token!,
        new_password: formData.password
      });
      
      setIsSuccess(true);
      toast({
        title: "password reset successful",
        description: "your password has been updated",
      });
    } catch (error) {
      toast({
        title: "password reset failed",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  if (!token || !email) {
    return null; // Will redirect in useEffect
  }



  return (
    <PageWrapper className="flex items-center justify-center">
      <ResetPasswordForm 
        formData={formData}
        isLoading={isLoading}
        isSuccess={isSuccess}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        setShowPassword={setShowPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        token={token}
        email={email}
      />
    </PageWrapper>
  );
}

function ResetPasswordForm({
  formData,
  isLoading,
  isSuccess,
  showPassword,
  showConfirmPassword,
  handleInputChange,
  handleSubmit,
  setShowPassword,
  setShowConfirmPassword,
  token,
  email
}: {
  formData: { password: string; confirmPassword: string };
  isLoading: boolean;
  isSuccess: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  handleInputChange: (field: 'password' | 'confirmPassword', value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
  token: string | null;
  email: string | null;
}) {
  const { goToHome, goToLogin, isUnloading, navigateTo } = useNavigation();

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={goToHome}
          className="mb-6 text-muted-foreground hover:text-foreground btn-hover-scale"
          disabled={isUnloading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          back to home
        </Button>

        <Card className="border-cottage-warm bg-cottage-cream card-hover-lift">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-serif text-cottage-brown">
              password reset successful
            </CardTitle>
            <CardDescription>
              your password has been updated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => {
                // Redirect to dashboard after successful password reset
                setTimeout(() => {
                  navigateTo('/dashboard');
                }, 1000);
              }}
              className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              disabled={isUnloading}
            >
              continue to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <Button
        variant="ghost"
        onClick={goToHome}
        className="mb-6 text-muted-foreground hover:text-foreground btn-hover-scale"
        disabled={isLoading || isUnloading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        back to home
      </Button>

      <Card className="border-cottage-warm bg-cottage-cream card-hover-lift">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif text-cottage-brown">
            reset your password
          </CardTitle>
          <CardDescription>
            enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-cottage-brown">
                new password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown pr-10"
                  required
                  disabled={isLoading || isUnloading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isUnloading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-cottage-brown">
                confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown pr-10"
                  required
                  disabled={isLoading || isUnloading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || isUnloading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              size="lg"
              disabled={isLoading || isUnloading}
            >
              {isLoading ? "resetting..." : "reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 