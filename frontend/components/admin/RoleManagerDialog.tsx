'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/lib/admin";
import { getUserPermissions, UserRole } from "@/lib/permissions";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

interface RoleManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onRoleUpdated: () => void;
}

export default function RoleManagerDialog({
  isOpen,
  onClose,
  selectedUser,
  onRoleUpdated
}: RoleManagerDialogProps) {
  const [newRole, setNewRole] = useState<string>("");
  const { toast } = useToast();

  // Initialize role when user is selected
  useEffect(() => {
    if (selectedUser) {
      setNewRole(selectedUser.role);
    }
  }, [selectedUser]);

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.updateUserRole({
        email: selectedUser.email,
        role: newRole
      });
      
      toast({
        title: "role updated",
        description: "user role has been updated successfully",
      });
      onClose();
      onRoleUpdated(); // Reload users list
    } catch (error) {
      toast({
        title: "failed to update role",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cottage-cream border-cottage-warm">
        <DialogHeader>
          <DialogTitle className="text-cottage-brown">
            Manage Role - {selectedUser?.username}
          </DialogTitle>
          <DialogDescription>
            Change the role for this user
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-cottage-brown">
              Role
            </Label>
            <select
              id="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full p-2 border border-cottage-warm rounded-md bg-cottage-cream focus:border-cottage-brown focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="p-3 bg-cottage-warm/30 rounded-lg border border-cottage-warm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-cottage-brown" />
              <span className="font-medium text-cottage-brown">Current Permissions:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getUserPermissions(newRole as UserRole).map((permission) => (
                <div key={permission} className="flex items-center space-x-2 text-sm">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-cottage-brown">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
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
            onClick={handleSaveRole}
            className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
          >
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 