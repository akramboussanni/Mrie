import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Permission, UserRole, hasPermission } from "@/lib/permissions";
import { LucideIcon } from "lucide-react";

interface DashboardItemProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  permission?: Permission;
  userRole?: UserRole;
  isAuthenticated?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DashboardItem({
  title,
  description,
  icon: Icon,
  onClick,
  permission,
  userRole,
  isAuthenticated = false,
  className = "",
  disabled = false
}: DashboardItemProps) {
  // If no permission is required, show the item
  if (!permission) {
    return (
      <Card 
        className={`border-cottage-warm bg-cottage-cream card-hover-lift cursor-pointer ${className}`}
        onClick={onClick}
      >
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Icon className="w-6 h-6 text-cottage-brown" />
            <CardTitle className="text-lg font-serif text-cottage-brown">
              {title}
            </CardTitle>
          </div>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If permission is required but no user role is provided, don't show
  if (!userRole) {
    return null;
  }

  // Check if user has the required permission
  const hasRequiredPermission = hasPermission(userRole, permission);

  // If user doesn't have permission, don't show the item
  if (!hasRequiredPermission) {
    return null;
  }

  return (
    <Card 
      className={`border-cottage-warm bg-cottage-cream card-hover-lift cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6 text-cottage-brown" />
          <CardTitle className="text-lg font-serif text-cottage-brown">
            {title}
          </CardTitle>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
} 