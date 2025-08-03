'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/lib/admin";

interface CreateUserFormProps {
  onUserCreated: () => void;
  onCancel: () => void;
}

export default function CreateUserForm({ onUserCreated, onCancel }: CreateUserFormProps) {
  const [createFormData, setCreateFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    created_at: Math.floor(Date.now() / 1000) // Default to current timestamp
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.username || !createFormData.email || !createFormData.password) {
      toast({
        title: "missing information",
        description: "please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      await adminService.createUser({
        username: createFormData.username,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        created_at: createFormData.created_at
      });
      
      toast({
        title: "user created",
        description: "new user has been created successfully",
      });
      
      setCreateFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        created_at: Math.floor(Date.now() / 1000)
      });
      onCancel();
      onUserCreated(); // Reload users list
    } catch (error) {
      toast({
        title: "failed to create user",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-cottage-warm bg-cottage-cream card-hover-lift mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-cottage-brown">
          create new user
        </CardTitle>
        <CardDescription>
          add a new user to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-cottage-brown">
                username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="enter username"
                value={createFormData.username}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, username: e.target.value }))}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cottage-brown">
                email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="enter email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-cottage-brown">
                password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="enter password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-cottage-brown">
                role
              </Label>
              <select
                id="role"
                value={createFormData.role}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 border border-cottage-warm rounded-md bg-cottage-cream focus:border-cottage-brown focus:outline-none"
                disabled={isCreating}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="created_at" className="text-cottage-brown">
                created date
              </Label>
              <Input
                id="created_at"
                type="datetime-local"
                value={new Date(createFormData.created_at * 1000).toISOString().slice(0, 16)}
                onChange={(e) => {
                  const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                  setCreateFormData(prev => ({ ...prev, created_at: timestamp }));
                }}
                className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                disabled={isCreating}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "creating..." : "create user"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 