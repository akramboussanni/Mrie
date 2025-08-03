'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/lib/admin";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

interface DeleteUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
}

export default function DeleteUserDialog({ 
  user, 
  isOpen, 
  onClose, 
  onUserDeleted 
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await adminService.deleteUser(user.id);
      toast({
        title: "user deleted",
        description: `${user.username} has been successfully deleted`,
      });
      onUserDeleted();
      onClose();
    } catch (error) {
      toast({
        title: "failed to delete user",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cottage-cream border-cottage-warm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-cottage-brown">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>delete user</span>
          </DialogTitle>
          <DialogDescription className="text-cottage-brown">
            are you sure you want to delete <strong>{user.username}</strong>? 
            this action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
          >
            cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                delete user
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 