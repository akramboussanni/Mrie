'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmEmail } = useAuth();
  const { toast } = useToast();

  const token = searchParams.get('token');



  useEffect(() => {
    document.title = "confirm email - mrie";
  }, []);

  // Auto-confirm email if token is present
  useEffect(() => {
    if (token && !isLoading && !isSuccess && !isError) {
      handleConfirmEmail();
    } else if (!token) {
      setIsError(true);
      setErrorMessage("invalid confirmation link");
    }
  }, [token]);

  const handleConfirmEmail = async () => {
    if (!token || isLoading) return;

    setIsLoading(true);
    
    try {
      await confirmEmail({ token });
      setIsSuccess(true);
      toast({
        title: "email confirmed",
        description: "your email has been confirmed successfully",
      });
    } catch (error) {
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : "confirmation failed");
      toast({
        title: "confirmation failed",
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
      <ConfirmEmailForm 
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={isError}
        errorMessage={errorMessage}
        handleConfirmEmail={handleConfirmEmail}
      />
    </PageWrapper>
  );
}

function ConfirmEmailForm({
  isLoading,
  isSuccess,
  isError,
  errorMessage,
  handleConfirmEmail
}: {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  handleConfirmEmail: () => void;
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
          {isLoading && (
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {isSuccess && (
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          )}
          {isError && (
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          )}
          <CardTitle className="text-2xl font-serif text-cottage-brown">
            {isLoading && "confirming email..."}
            {isSuccess && "email confirmed"}
            {isError && "confirmation failed"}
            {!isLoading && !isSuccess && !isError && "confirm email"}
          </CardTitle>
          <CardDescription>
            {isLoading && "please wait while we confirm your email"}
            {isSuccess && "your email has been confirmed successfully"}
            {isError && errorMessage}
            {!isLoading && !isSuccess && !isError && "click the button below to confirm"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {!isLoading && !isSuccess && !isError && (
            <Button
              onClick={handleConfirmEmail}
              className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              disabled={isLoading || isUnloading}
            >
              confirm email
            </Button>
          )}
          {isSuccess && (
            <Button
              onClick={goToLogin}
              className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
              disabled={isUnloading}
            >
              sign in now
            </Button>
          )}
          {isError && (
            <div className="space-y-3">
              <Button
                onClick={goToHome}
                className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
                disabled={isUnloading}
              >
                back to home
              </Button>
              <div className="text-sm text-muted-foreground">
                need help? contact support
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 