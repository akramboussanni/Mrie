import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Clock } from "lucide-react";

interface UserInfoCardProps {
  user: {
    username: string;
    email: string;
    role: string;
    created_at: number;
  };
  title?: string;
  description?: string;
  className?: string;
}

export function UserInfoCard({ 
  user, 
  title = "account information", 
  description = "your account details and information",
  className = ""
}: UserInfoCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className={`border-cottage-warm bg-cottage-cream card-hover-lift ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-serif text-cottage-brown">
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-cottage-brown" />
            <div>
              <p className="text-sm text-muted-foreground">username</p>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-cottage-brown" />
            <div>
              <p className="text-sm text-muted-foreground">email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-cottage-warm text-cottage-brown">
              {user.role}
            </Badge>
            <div>
              <p className="text-sm text-muted-foreground">role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-cottage-brown" />
            <div>
              <p className="text-sm text-muted-foreground">member since</p>
              <p className="font-medium">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 