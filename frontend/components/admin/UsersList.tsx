'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, User, Shield, Mail, Calendar, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/lib/admin";
import DeleteUserDialog from "./DeleteUserDialog";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: number;
}

interface UsersListProps {
  onRoleManagerOpen: (user: User) => void;
  onPermissionManagerOpen: (user: User) => void;
}

export default function UsersList({ onRoleManagerOpen, onPermissionManagerOpen }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await adminService.getUsers();
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "failed to load users",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUserForDelete(user);
    setShowDeleteDialog(true);
  };

  const handleUserDeleted = () => {
    // Reload users after deletion
    loadUsers();
  };

  return (
    <>
      <Card className="border-cottage-warm bg-cottage-cream card-hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif text-cottage-brown">
                users
              </CardTitle>
              <CardDescription>
                manage system users and their roles
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-cottage-brown border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">loading users...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-cottage-warm rounded-lg bg-background"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-cottage-warm rounded-full">
                      <Users className="w-5 h-5 text-cottage-brown" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{user.username}</p>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-cottage-brown text-cottage-cream' : 'bg-cottage-warm text-cottage-brown'}
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRoleManagerOpen(user)}
                      className="text-cottage-brown hover:bg-cottage-warm"
                    >
                      <User className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPermissionManagerOpen(user)}
                      className="text-cottage-brown hover:bg-cottage-warm"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "no users found matching your search" : "no users found"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteUserDialog
        user={selectedUserForDelete}
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUserForDelete(null);
        }}
        onUserDeleted={handleUserDeleted}
      />
    </>
  );
} 