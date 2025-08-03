'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogOut, 
  Settings, 
  Users, 
  Building2, 
  Calendar,
  User,
  Mail,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { settingsService } from "@/lib/settings";
import { Permission, UserRole } from "@/lib/permissions";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { DashboardItem } from "@/components/ui/dashboard-item";
import { UserInfoCard } from "@/components/ui/user-info-card";
import { useNavigation } from "@/components/ui/navigation-hook";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();



  useEffect(() => {
    document.title = "dashboard - mrie";
  }, []);

  // No redirect - dashboard is now public

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "logged out",
        description: "you have been logged out successfully",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "logout failed",
        description: "please try again",
        variant: "destructive",
      });
    }
  };





  // Show loading while checking authentication
  if (isAuthenticated === null) {
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
      <DashboardContent 
        user={user}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        toast={toast}
      />
    </PageWrapper>
  );
}

function DashboardContent({ 
  user, 
  isAuthenticated, 
  handleLogout,
  toast
}: {
  user: any;
  isAuthenticated: boolean;
  handleLogout: () => void;
  toast: any;
}) {
  const { navigateTo, isUnloading } = useNavigation();

  const navigateToPrayerTimes = async () => {
    try {
      const defaultMasjid = await settingsService.getDefaultMasjid();
      if (defaultMasjid) {
        navigateTo(`/prayertimes/${defaultMasjid}`);
      } else {
        toast({
          title: "no default masjid set",
          description: "please set a default masjid in the admin panel",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "failed to get default masjid",
        description: "please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif text-cottage-brown mb-2">
            {isAuthenticated ? `welcome back, ${user?.username}` : 'dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isAuthenticated 
              ? 'manage your account and access mrie features'
              : 'public dashboard with limited features'
            }
          </p>
        </div>
        {isAuthenticated ? (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            logout
          </Button>
        ) : (
          <Button
            onClick={() => navigateTo('/login')}
            className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
            disabled={isUnloading}
          >
            login
          </Button>
        )}
      </div>

      {/* User Info Card - Only show for authenticated users */}
      {isAuthenticated && user && (
        <UserInfoCard 
          user={user} 
          className="mb-6"
        />
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prayer Times - Available to all */}
        <DashboardItem
          title="prayer times"
          description="view daily prayer times and schedules"
          icon={Building2}
          onClick={navigateToPrayerTimes}
          disabled={isUnloading}
        />

        {/* Settings - Only for authenticated users */}
        <DashboardItem
          title="settings"
          description="manage your account preferences"
          icon={Settings}
          onClick={() => navigateTo('/settings')}
          permission={Permission.VIEW_SETTINGS}
          userRole={user?.role as UserRole}
          isAuthenticated={isAuthenticated}
          disabled={isUnloading}
        />

        {/* Admin Panel - Only for admins */}
        <DashboardItem
          title="admin panel"
          description="manage users and system settings"
          icon={Users}
          onClick={() => navigateTo('/admin')}
          permission={Permission.VIEW_ADMIN_PANEL}
          userRole={user?.role as UserRole}
          isAuthenticated={isAuthenticated}
          disabled={isUnloading}
        />

        {/* Login Prompt - Only for guests */}
        {!isAuthenticated && (
          <DashboardItem
            title="login"
            description="sign in to access all features"
            icon={User}
            onClick={() => navigateTo('/login')}
            disabled={isUnloading}
          />
        )}
      </div>
    </div>
  );
} 