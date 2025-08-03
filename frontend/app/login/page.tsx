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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  // Get the redirect path from search params
  const from = searchParams.get('from') || '/dashboard';



  useEffect(() => {
    document.title = "login - mrie";
  }, []);

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      return false;
    }
    
    if (isLoading) {
      return false;
    }

    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast({
        title: "welcome back",
        description: "you've successfully entered mrie",
      });
      
      return true; // Login successful
    } catch (error) {
      // Provide more specific error messages
      let errorMessage = "please check your credentials";
      let errorTitle = "login failed";
      
      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();
        
        if (errorText.includes('invalid') || errorText.includes('credentials')) {
          errorTitle = "invalid credentials";
          errorMessage = "your email or password is incorrect";
        } else if (errorText.includes('network') || errorText.includes('connection')) {
          errorTitle = "connection error";
          errorMessage = "please check your internet connection and try again";
        } else if (errorText.includes('timeout')) {
          errorTitle = "request timeout";
          errorMessage = "the request took too long, please try again";
        } else if (errorText.includes('server') || errorText.includes('500')) {
          errorTitle = "server error";
          errorMessage = "something went wrong on our end, please try again later";
        } else if (errorText.includes('email') || errorText.includes('format')) {
          errorTitle = "invalid email";
          errorMessage = "please enter a valid email address";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      return false; // Login failed
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <PageWrapper className="flex items-center justify-center">
      <LoginForm 
        formData={formData}
        isLoading={isLoading}
        showPassword={showPassword}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        setShowPassword={setShowPassword}
        router={router}
        from={from}
        errors={errors}
      />
    </PageWrapper>
  );
}

function LoginForm({
  formData,
  isLoading,
  showPassword,
  handleInputChange,
  handleSubmit,
  setShowPassword,
  router,
  from,
  errors
}: {
  formData: { email: string; password: string };
  isLoading: boolean;
  showPassword: boolean;
  handleInputChange: (field: 'email' | 'password', value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<boolean>;
  setShowPassword: (show: boolean) => void;
  router: any;
  from: string;
  errors: { email?: string; password?: string };
}) {
  const { goToHome, goToRegister, goToForgotPassword, isUnloading, navigateTo } = useNavigation();

  // Handle successful login navigation
  const handleSuccessfulLogin = () => {
    navigateTo(from);
  };

  // Create a new form submission handler that uses navigation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loginSuccess = await handleSubmit(e);
    
    // Only navigate if login was successful
    if (loginSuccess) {
      handleSuccessfulLogin();
    }
  };

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
            welcome to mrie
          </CardTitle>
          <CardDescription>
            enter your credentials to access your space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cottage-brown">
                email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`bg-cottage-cream focus:border-cottage-brown ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-cottage-warm'
                }`}
                required
                disabled={isLoading || isUnloading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-cottage-brown">
                password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`bg-cottage-cream focus:border-cottage-brown pr-10 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-cottage-warm'
                  }`}
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
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              size="lg"
              disabled={isLoading || isUnloading}
            >
              {isLoading ? "entering..." : "enter mrie"}
            </Button>
          </form>
          
          <div className="mt-6 space-y-3 text-center">
            <Button
              variant="link"
              onClick={goToForgotPassword}
              className="text-cottage-brown hover:text-cottage-brown/80 p-0 h-auto"
              disabled={isLoading || isUnloading}
            >
              forgot your password?
            </Button>
            <div className="text-sm text-muted-foreground">
              don't have an account?{" "}
              <Button
                variant="link"
                onClick={goToRegister}
                className="text-cottage-brown hover:text-cottage-brown/80 p-0 h-auto text-sm"
                disabled={isLoading || isUnloading}
              >
                register here
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 