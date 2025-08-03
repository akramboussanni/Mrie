'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/lib/auth";
import { hasPermission, Permission, UserRole } from "@/lib/permissions";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function SettingsPage() {
  const [isUnloading, setIsUnloading] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();



  useEffect(() => {
    document.title = "settings - mrie";
  }, []);

  // Check permissions
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role as UserRole;
      if (!hasPermission(userRole, Permission.VIEW_SETTINGS)) {
        router.push('/dashboard');
        toast({
          title: "access denied",
          description: "you don't have permission to access settings",
          variant: "destructive",
        });
      }
    } else if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router, toast]);

  const goBack = () => {
    router.push('/dashboard');
  };

  const handleChangePassword = async () => {
    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must be the same",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "New password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        old_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated",
      });
      
      // Reset form and close dialog
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setShowChangePasswordDialog(false);
    } catch (error) {
      toast({
        title: "Failed to change password",
        description: (error as Error).message || "An error occurred while changing your password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cottage-brown border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="text-muted-foreground hover:text-foreground btn-hover-scale"
            disabled={isUnloading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            back to dashboard
          </Button>
        </div>

          <div className="mb-6">
            <h1 className="text-3xl font-serif text-cottage-brown mb-2">
              settings
            </h1>
            <p className="text-muted-foreground">
              manage your account preferences
            </p>
          </div>

          {/* Settings Content */}
          <Card className="border-cottage-warm bg-cottage-cream card-hover-lift">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-cottage-brown">
                account information
              </CardTitle>
              <CardDescription>
                view your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">member since</p>
                  <p className="font-medium">
                    {new Date(user.created_at * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-cottage-warm">
                <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cottage-cream border-cottage-warm">
                    <DialogHeader>
                      <DialogTitle className="text-cottage-brown">Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new password
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-cottage-brown">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-cottage-brown">
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Enter new password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-cottage-brown">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowChangePasswordDialog(false);
                          setPasswordForm({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
                      >
                        {isChangingPassword ? "Changing..." : "Change Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card className="border-cottage-warm bg-cottage-cream card-hover-lift mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-cottage-brown">
                more settings coming soon
              </CardTitle>
              <CardDescription>
                additional account preferences will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                user-specific settings and preferences will be added in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
    </PageWrapper>
  );
} 