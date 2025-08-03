'use client'

import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";

interface AdminHeaderProps {
  onBack: () => void;
  onCreateUser: () => void;
  showCreateForm: boolean;
  isLoading: boolean;
  isUnloading: boolean;
}

export default function AdminHeader({
  onBack,
  onCreateUser,
  showCreateForm,
  isLoading,
  isUnloading
}: AdminHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground btn-hover-scale"
          disabled={isLoading || isUnloading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          back to dashboard
        </Button>
        <Button
          onClick={onCreateUser}
          className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
          disabled={isLoading || isUnloading}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {showCreateForm ? "cancel" : "create user"}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-serif text-cottage-brown mb-2">
          admin panel
        </h1>
        <p className="text-muted-foreground">
          manage users and system settings
        </p>
      </div>
    </>
  );
} 