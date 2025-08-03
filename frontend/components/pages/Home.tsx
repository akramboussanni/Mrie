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
import { prayerTimesService } from "@/lib/prayertimes";
import { settingsService } from "@/lib/settings";

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isUnloading, setIsUnloading] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [defaultMasjid, setDefaultMasjid] = useState<string | null>(null);
  const [isLoadingPrayerTimes, setIsLoadingPrayerTimes] = useState(false);

  useEffect(() => {
    document.title = "home - mrie";
  }, []);

  const features = [
    {
      name: "zorro",
      description: "media ripper for downloading content",
      icon: <Scissors className="w-5 h-5" />,
      status: "active"
    },
    {
      name: "url shortener",
      description: "create short, memorable links",
      icon: <Link className="w-5 h-5" />,
      status: "active"
    },
    {
      name: "prayer times",
      description: "islamic prayer time calculator",
      icon: <Clock className="w-5 h-5" />,
      status: "active"
    },
    {
      name: "labrador ai",
      description: "intelligent assistant for various tasks",
      icon: <Bot className="w-5 h-5" />,
      status: "beta"
    }
  ];

  const handleLoginClick = () => {
    router.push('/login');
  };

  const loadPrayerTimes = async () => {
    if (!defaultMasjid) return;
    
    setIsLoadingPrayerTimes(true);
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const times = await prayerTimesService.getPrayerTimes(defaultMasjid, day, month);
      setPrayerTimes(times);
    } catch (error) {
      console.error('Failed to load prayer times:', error);
    } finally {
      setIsLoadingPrayerTimes(false);
    }
  };

  // Load default masjid and prayer times
  useEffect(() => {
    const loadDefaultMasjid = async () => {
      try {
        const masjid = await settingsService.getDefaultMasjid();
        setDefaultMasjid(masjid);
        if (masjid) {
          await loadPrayerTimes();
        }
      } catch (error) {
        console.error('Failed to load default masjid:', error);
      }
    };

    loadDefaultMasjid();
  }, []);

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
              <Card className="border-cottage-warm bg-cottage-cream card-hover-lift h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cottage-warm rounded-lg">
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
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Prayer Times Section */}
        {defaultMasjid && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-foreground font-serif mb-2">prayer times</h2>
              <p className="text-muted-foreground">today's prayer times</p>
            </div>
            
            <Card className="border-cottage-warm bg-cottage-cream card-hover-lift max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Building2 className="w-6 h-6 text-cottage-brown" />
                  <CardTitle className="text-xl font-serif text-cottage-brown">
                    {defaultMasjid}
                  </CardTitle>
                </div>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPrayerTimes ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-cottage-brown border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">loading prayer times...</p>
                  </div>
                ) : prayerTimes ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: 'fajr', time: prayerTimes.fajr, icon: '🌅' },
                      { name: 'shuruq', time: prayerTimes.shuruq, icon: '☀️' },
                      { name: 'dhuhr', time: prayerTimes.dhuhr, icon: '☀️' },
                      { name: 'asr', time: prayerTimes.asr, icon: '🌤️' },
                      { name: 'maghreb', time: prayerTimes.maghreb, icon: '🌅' },
                      { name: 'isha', time: prayerTimes.isha, icon: '🌙' }
                    ].map((prayer) => (
                      <div key={prayer.name} className="text-center p-3 rounded-lg border border-cottage-warm bg-background">
                        <div className="text-2xl mb-2">{prayer.icon}</div>
                        <p className="font-medium capitalize text-sm mb-1">{prayer.name}</p>
                        <p className="font-mono text-lg">
                          {new Date(prayer.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">failed to load prayer times</p>
                    <Button 
                      onClick={loadPrayerTimes}
                      variant="outline"
                      className="mt-4 border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
                    >
                      try again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Home;