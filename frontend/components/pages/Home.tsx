'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Home as HomeIcon, Scissors, Link, Clock, Bot, Heart, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isUnloading, setIsUnloading] = useState(false);

  useEffect(() => {
    document.title = "home - mrie";
  }, []);

  const features = [
    {
      name: "prayer times",
      description: "islamic prayer time calculator",
      icon: <Clock className="w-5 h-5" />,
      status: "active",
      active: true,
      path: "/prayertimes/default"
    },
    {
      name: "zorro",
      description: "media ripper for downloading content",
      icon: <Scissors className="w-5 h-5" />,
      status: "in progress",
      active: false,
      path: null
    },
    {
      name: "url shortener",
      description: "create short, memorable links",
      icon: <Link className="w-5 h-5" />,
      status: "in progress",
      active: false,
      path: null
    },
    {
      name: "labrador ai",
      description: "intelligent assistant for various tasks",
      icon: <Bot className="w-5 h-5" />,
      status: "in progress",
      active: false,
      path: null
    }
  ];

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleFeatureClick = (feature: any) => {
    if (feature.active && feature.path) {
      router.push(feature.path);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cottage-brown mx-auto mb-4"></div>
          <p className="text-muted-foreground">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground font-serif mb-6">mrie</h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            multipurpose repository of internet-accessible essentials
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto">
            personal tools and services with login required.
          </p>
        </div>

        {/* Access Options */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            {/* Dashboard Access */}
            <Card className="border-cottage-brown/20 bg-cottage-cream text-center card-hover-lift">
              <CardHeader>
                <CardTitle className="text-cottage-brown">
                  public dashboard
                </CardTitle>
                <CardDescription>
                  access prayer times and basic features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  size="lg"
                  variant="outline"
                  className="border-cottage-brown text-cottage-brown hover:bg-cottage-brown hover:text-cottage-cream btn-hover-scale"
                >
                  view dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Login Access */}
            <Card className="border-cottage-brown/20 bg-cottage-cream text-center card-hover-lift">
              <CardHeader>
                <CardTitle className="text-cottage-brown">
                  full access
                </CardTitle>
                <CardDescription>
                  login to access all mrie features and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLoginClick}
                  size="lg"
                  className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
                  disabled={isUnloading}
                >
                  continue to login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center mb-16">
          <Separator className="w-full max-w-md bg-cottage-warm" />
        </div>

        {/* Features Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-foreground font-serif">features</h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="transition-all duration-500 ease-out"
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <Card 
                className={`border-cottage-warm bg-cottage-cream card-hover-lift h-full ${
                  feature.active 
                    ? 'cursor-pointer hover:shadow-lg hover:scale-105' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      feature.active ? 'bg-cottage-warm' : 'bg-gray-300'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={feature.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                  {!feature.active && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      coming soon
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Home;