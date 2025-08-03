'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { getUserPermissions, UserRole } from "@/lib/permissions";

interface UserPermissionsCardProps {
  userRole: string;
}

export default function UserPermissionsCard({ userRole }: UserPermissionsCardProps) {
  return (
    <Card className="border-cottage-warm bg-cottage-cream card-hover-lift mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-cottage-brown">
          your permissions
        </CardTitle>
        <CardDescription>
          current permissions for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {getUserPermissions(userRole as UserRole).map((permission) => (
            <div key={permission} className="flex items-center space-x-2 p-2 bg-cottage-warm/30 rounded-lg">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-cottage-brown">
                {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 