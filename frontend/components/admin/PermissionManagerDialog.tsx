'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/lib/admin";
import { Permission, getUserPermissions, UserRole } from "@/lib/permissions";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

interface PermissionManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onPermissionsUpdated: () => void;
}

export default function PermissionManagerDialog({
  isOpen,
  onClose,
  selectedUser,
  onPermissionsUpdated
}: PermissionManagerDialogProps) {
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const { toast } = useToast();

  // Initialize permissions when user is selected
  useEffect(() => {
    if (selectedUser) {
      setUserPermissions(getUserPermissions(selectedUser.role as UserRole));
    }
  }, [selectedUser]);

  const handlePermissionToggle = (permission: Permission) => {
    setUserPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.updateUserPermissions({
        email: selectedUser.email,
        permissions: userPermissions
      });
      
      toast({
        title: "permissions updated",
        description: "user permissions have been updated successfully",
      });
      onClose();
      onPermissionsUpdated(); // Reload users list
    } catch (error) {
      toast({
        title: "failed to update permissions",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cottage-cream border-cottage-warm max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-cottage-brown">
            Manage Permissions - {selectedUser?.username}
          </DialogTitle>
          <DialogDescription>
            Configure specific permissions for this user
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(Permission).map((permission) => (
              <div key={permission} className="flex items-center space-x-3 p-3 border border-cottage-warm rounded-lg">
                <input
                  type="checkbox"
                  id={permission}
                  checked={userPermissions.includes(permission)}
                  onChange={() => handlePermissionToggle(permission)}
                  className="w-4 h-4 text-cottage-brown border-cottage-warm rounded focus:ring-cottage-brown"
                />
                <label htmlFor={permission} className="text-sm font-medium text-cottage-brown cursor-pointer">
                  {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePermissions}
            className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
          >
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 