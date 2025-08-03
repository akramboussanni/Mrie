'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { canAccessAdminPanel } from "@/lib/permissions";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";
import {
  AdminHeader,
  CreateUserForm,
  UsersList,
  UserPermissionsCard,
  PermissionManagerDialog,
  RoleManagerDialog,
  AppSettings
} from "@/components/admin";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

export default function AdminPage() {
  const [isUnloading, setIsUnloading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Dialog states
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();



  useEffect(() => {
    document.title = "admin - mrie";
  }, []);

  // Check authentication and admin permissions
  useEffect(() => {
    // Wait for authentication to be determined
    if (authLoading) return;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // If authenticated but no user data, wait
    if (!user) return;
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      router.push('/dashboard');
      toast({
        title: "access denied",
        description: "you don't have permission to access the admin panel",
        variant: "destructive",
      });
      return;
    }
  }, [authLoading, isAuthenticated, user, router, toast]);

  const goBack = () => {
    router.push('/dashboard');
  };

  const handleCreateUser = () => {
    setShowCreateForm(!showCreateForm);
  };

  const handleUserCreated = () => {
    // This will be handled by the CreateUserForm component
  };

  const handleRoleManagerOpen = (user: User) => {
    setSelectedUserForRole(user);
    setShowRoleManager(true);
  };

  const handlePermissionManagerOpen = (user: User) => {
    setSelectedUserForPermissions(user);
    setShowPermissionManager(true);
  };

  const handleRoleUpdated = () => {
    // This will be handled by the RoleManagerDialog component
  };

  const handlePermissionsUpdated = () => {
    // This will be handled by the PermissionManagerDialog component
  };

  // Show loading while checking permissions
  if (authLoading) {
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
      <AdminContent 
        user={user}
        showCreateForm={showCreateForm}
        showPermissionManager={showPermissionManager}
        showRoleManager={showRoleManager}
        selectedUserForPermissions={selectedUserForPermissions}
        selectedUserForRole={selectedUserForRole}
        handleCreateUser={handleCreateUser}
        handleUserCreated={handleUserCreated}
        handleRoleManagerOpen={handleRoleManagerOpen}
        handlePermissionManagerOpen={handlePermissionManagerOpen}
        handleRoleUpdated={handleRoleUpdated}
        handlePermissionsUpdated={handlePermissionsUpdated}
        setShowCreateForm={setShowCreateForm}
        setShowPermissionManager={setShowPermissionManager}
        setShowRoleManager={setShowRoleManager}
      />
    </PageWrapper>
  );
}

function AdminContent({
  user,
  showCreateForm,
  showPermissionManager,
  showRoleManager,
  selectedUserForPermissions,
  selectedUserForRole,
  handleCreateUser,
  handleUserCreated,
  handleRoleManagerOpen,
  handlePermissionManagerOpen,
  handleRoleUpdated,
  handlePermissionsUpdated,
  setShowCreateForm,
  setShowPermissionManager,
  setShowRoleManager
}: {
  user: any;
  showCreateForm: boolean;
  showPermissionManager: boolean;
  showRoleManager: boolean;
  selectedUserForPermissions: any;
  selectedUserForRole: any;
  handleCreateUser: () => void;
  handleUserCreated: () => void;
  handleRoleManagerOpen: (user: any) => void;
  handlePermissionManagerOpen: (user: any) => void;
  handleRoleUpdated: () => void;
  handlePermissionsUpdated: () => void;
  setShowCreateForm: (show: boolean) => void;
  setShowPermissionManager: (show: boolean) => void;
  setShowRoleManager: (show: boolean) => void;
}) {
  const { goToDashboard, isUnloading } = useNavigation();

  return (
    <div className="max-w-6xl mx-auto">
      <AdminHeader
        onBack={goToDashboard}
        onCreateUser={handleCreateUser}
        showCreateForm={showCreateForm}
        isLoading={false}
        isUnloading={isUnloading}
      />

      {/* Create User Form */}
      {showCreateForm && (
        <CreateUserForm
          onUserCreated={handleUserCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Users List */}
      <UsersList
        onRoleManagerOpen={handleRoleManagerOpen}
        onPermissionManagerOpen={handlePermissionManagerOpen}
      />

      {/* Current User Permissions */}
      <UserPermissionsCard userRole={user?.role || ''} />

      {/* App Settings */}
      <AppSettings />

      {/* Permission Manager Dialog */}
      <PermissionManagerDialog
        isOpen={showPermissionManager}
        onClose={() => setShowPermissionManager(false)}
        selectedUser={selectedUserForPermissions}
        onPermissionsUpdated={handlePermissionsUpdated}
      />

      {/* Role Manager Dialog */}
      <RoleManagerDialog
        isOpen={showRoleManager}
        onClose={() => setShowRoleManager(false)}
        selectedUser={selectedUserForRole}
        onRoleUpdated={handleRoleUpdated}
      />
    </div>
  );
} 