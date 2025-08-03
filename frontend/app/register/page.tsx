'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();



  useEffect(() => {
    document.title = "register - mrie";
  }, []);

  const handleInputChange = (field: 'username' | 'email' | 'password' | 'confirmPassword', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || isLoading) {
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

    // Client-side validation
    if (formData.username.includes('@')) {
      toast({
        title: "invalid username",
        description: "username cannot contain '@' symbol",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "password too short",
        description: "password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    // Check for at least one lowercase, uppercase, and digit
    const hasLower = /[a-z]/.test(formData.password);
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasDigit = /\d/.test(formData.password);
    
    if (!hasLower || !hasUpper || !hasDigit) {
      toast({
        title: "password requirements not met",
        description: "password must contain at least one lowercase letter, uppercase letter, and digit",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate confirmation URL
      const confirmationUrl = `${window.location.origin}/confirm-email`;
      
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        url: confirmationUrl
      });
      
      toast({
        title: "account created",
        description: "please check your email to confirm your account",
      });
      
      router.push('/login');
    } catch (error) {
      toast({
        title: "registration failed",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToHome = () => {
    router.push('/');
  };

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <PageWrapper className="flex items-center justify-center">
      <RegisterContent 
        formData={formData}
        isLoading={isLoading}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        setShowPassword={setShowPassword}
        setShowConfirmPassword={setShowConfirmPassword}
      />
    </PageWrapper>
  );
}

function RegisterContent({
  formData,
  isLoading,
  showPassword,
  showConfirmPassword,
  handleInputChange,
  handleSubmit,
  setShowPassword,
  setShowConfirmPassword
}: {
  formData: { username: string; email: string; password: string; confirmPassword: string };
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  handleInputChange: (field: 'username' | 'email' | 'password' | 'confirmPassword', value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
}) {
  const { goToHome, goToLogin, isUnloading } = useNavigation();

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
            join mrie
          </CardTitle>
          <CardDescription>
            create your account to access all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-cottage-brown">
                username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="choose a unique username (no @ symbol)"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isLoading || isUnloading}
              />
              <p className="text-xs text-muted-foreground">
                username cannot contain @ symbol
              </p>
            </div>
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
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isLoading || isUnloading}
              />
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
              <p className="text-xs text-muted-foreground">
                password must be at least 8 characters with lowercase, uppercase, and digit
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-cottage-brown">
                confirm password
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
              {isLoading ? "creating..." : "create account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">
              already have an account?{" "}
              <Button
                variant="link"
                onClick={goToLogin}
                className="text-cottage-brown hover:text-cottage-brown/80 p-0 h-auto text-sm"
                disabled={isLoading || isUnloading}
              >
                sign in here
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 