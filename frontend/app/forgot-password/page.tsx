'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { toast } = useToast();



  useEffect(() => {
    document.title = "forgot password - mrie";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || isLoading) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate reset URL
      const resetUrl = `${window.location.origin}/reset-password`;
      
      await forgotPassword({
        email,
        url: resetUrl
      });
      
      setIsSuccess(true);
      toast({
        title: "reset email sent",
        description: "please check your email for password reset instructions",
      });
    } catch (error) {
      toast({
        title: "failed to send reset email",
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

  if (isSuccess) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className={`transition-all duration-500 ease-out ${
            !isUnloading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
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
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-serif text-cottage-brown">
                  check your email
                </CardTitle>
                <CardDescription>
                  we've sent password reset instructions to {email}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  if you don't see the email, check your spam folder
                </p>
                <Button
                  onClick={goToLogin}
                  className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
                  disabled={isUnloading}
                >
                  back to login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="flex items-center justify-center">
      <ForgotPasswordContent 
        email={email}
        isLoading={isLoading}
        isSuccess={isSuccess}
        setEmail={setEmail}
        handleSubmit={handleSubmit}
      />
    </PageWrapper>
  );
}

function ForgotPasswordContent({
  email,
  isLoading,
  isSuccess,
  setEmail,
  handleSubmit
}: {
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  setEmail: (email: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  const { goToHome, goToLogin, isUnloading } = useNavigation();

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
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-cottage-brown">
              check your email
            </CardTitle>
            <CardDescription>
              we've sent password reset instructions to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              if you don't see the email, check your spam folder
            </p>
            <Button
              onClick={goToLogin}
              className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              disabled={isUnloading}
            >
              back to login
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
            forgot your password?
          </CardTitle>
          <CardDescription>
            enter your email to receive reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cottage-brown">
                email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isLoading || isUnloading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              size="lg"
              disabled={isLoading || isUnloading}
            >
              {isLoading ? "sending..." : "send reset email"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">
              remember your password?{" "}
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