
'use client'

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { useNavigation } from "@/components/ui/navigation-hook";
import { 
  ArrowLeft, 
  Building2, 
  Calendar,
  RefreshCw,
  ChevronDown,
  Info
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { prayerTimesService, MosqueInfo } from "@/lib/prayertimes";
import { hasPermission, Permission, UserRole } from "@/lib/permissions";
import { settingsService } from "@/lib/settings";

interface PrayerTimesData {
  fajr: string;
  shuruq: string;
  dhuhr: string;
  asr: string;
  maghreb: string;
  isha: string;
  timezone: string;
}

type PrayerName = 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghreb' | 'isha';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghreb', 'isha'];
const PRAYER_NAMES: Record<PrayerName, string> = {
  fajr: 'fajr',
  shuruq: 'shuruq',
  dhuhr: 'dhuhr',
  asr: 'asr',
  maghreb: 'maghreb',
  isha: 'isha'
};

const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌅',
  shuruq: '☀️',
  dhuhr: '☀️',
  asr: '🌤️',
  maghreb: '🌅',
  isha: '🌙'
};

export default function PrayerTimesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrayerTimesContent />
    </Suspense>
  );
}

function PrayerTimesContent() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [tomorrowPrayerTimes, setTomorrowPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMosques, setAvailableMosques] = useState<MosqueInfo[]>([]);
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const masjidId = params.masjidId as string;

  // Prayer times are accessible to all users (guests and authenticated)
  const canViewPrayerTimes = true; // Always true since prayer times are public

  const currentDate = new Date();

  useEffect(() => {
    if (!masjidId) return;
    
    // If masjidId is "default", redirect to the actual default masjid
    if (masjidId === "default") {
      const redirectToDefault = async () => {
        try {
          const defaultMasjid = await settingsService.getDefaultMasjid();
          if (defaultMasjid) {
            router.replace(`/prayertimes/${defaultMasjid}`);
            return;
          }
        } catch (error) {
          console.error('Failed to get default masjid:', error);
        }
        // Fallback to a known masjid if default is not available
        router.replace('/prayertimes/mosquee-de-paris');
      };
      redirectToDefault();
      return;
    }
    
    loadPrayerTimes();
    loadTomorrowPrayerTimes();
    loadAvailableMosques();
  }, [masjidId, router]);

  useEffect(() => {
    if (!prayerTimes) return;
    
    const interval = setInterval(() => {
      const nextPrayer = getNextPrayer();
      if (nextPrayer) {
        setCountdown(formatCountdown(nextPrayer.timeUntil));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [prayerTimes, tomorrowPrayerTimes]);

  async function loadPrayerTimes() {
    setIsLoading(true);
    setError(null);
    try {
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const times = await prayerTimesService.getPrayerTimes(masjidId, day, month);
      setPrayerTimes(times);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      toast({ 
        title: 'failed to load prayer times', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTomorrowPrayerTimes() {
    try {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDate();
      const month = tomorrow.getMonth() + 1;
      const times = await prayerTimesService.getPrayerTimes(masjidId, day, month);
      setTomorrowPrayerTimes(times);
    } catch {
      // Silent fail for tomorrow's times
    }
  }

  async function loadAvailableMosques() {
    try {
      const mosques = await prayerTimesService.getAvailableMosques();
      setAvailableMosques(mosques);
    } catch (error) {
      console.error('failed to load available mosques:', error);
      // Fallback to default mosques if API fails
      setAvailableMosques([
        { id: 'mosquee-de-paris', name: 'Grande Mosquée de Paris', country: 'France', city: 'Paris' },
        { id: 'grande-mosquee-de-lyon', name: 'Grande Mosquée de Lyon', country: 'France', city: 'Lyon' },
        { id: 'mosquee-al-salam', name: 'Mosquée Al-Salam', country: 'France', city: 'Paris' },
        { id: 'masjid-al-noor', name: 'Masjid Al-Noor', country: 'France', city: 'Paris' },
        { id: 'masjid-al-rahma', name: 'Masjid Al-Rahma', country: 'France', city: 'Lyon' },
      ]);
    }
  }

  // Get current time in local timezone
  const getCurrentTime = () => {
    return new Date();
  };

  // Get current prayer (the last prayer that has passed)
  const getCurrentPrayer = (): PrayerName | null => {
    if (!prayerTimes) return null;
    
    const now = getCurrentTime();
    const prayers = PRAYER_ORDER.map(name => ({
      name,
      time: new Date(prayerTimes[name]) // This will parse UTC and convert to local
    }));
    
    // Find the last prayer that has passed
    for (let i = prayers.length - 1; i >= 0; i--) {
      if (now >= prayers[i].time) {
        return prayers[i].name;
      }
    }
    
    return null;
  };

  // Check if a prayer has passed (with special conditions)
  const hasPrayerPassed = (prayerName: PrayerName): boolean => {
    if (!prayerTimes) return false;
    
    const now = getCurrentTime();
    
    // Special conditions only for Fajr and Isha
    if (prayerName === 'fajr') {
      const shuruqTime = new Date(prayerTimes.shuruq);
      const dhuhrTime = new Date(prayerTimes.dhuhr);
      // Fajr shows as passed if we're between shuruq and dhuhr
      return now >= shuruqTime && now < dhuhrTime;
    }
    
    if (prayerName === 'isha') {
      const nightTimes = calculateNightTimes();
      const fajrTime = new Date(prayerTimes.fajr);
      // Isha shows as passed if we're between midnight and fajr
      return nightTimes?.midnight ? now >= nightTimes.midnight && now < fajrTime : false;
    }
    
    // For all other prayers, never show as "passed"
    return false;
  };

  // Get next prayer with time until
  const getNextPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = getCurrentTime();
    const currentPrayer = getCurrentPrayer();
    
    // Find next prayer today
    for (const prayerName of PRAYER_ORDER) {
      const prayerTime = new Date(prayerTimes[prayerName]); // This will parse UTC and convert to local
      if (now < prayerTime) {
        return {
          name: prayerName,
          time: prayerTime,
          timeUntil: prayerTime.getTime() - now.getTime()
        };
      }
    }
    
    // If all prayers passed, next is tomorrow's Fajr
    if (tomorrowPrayerTimes) {
      const tomorrowFajr = new Date(tomorrowPrayerTimes.fajr); // This will parse UTC and convert to local
      return {
        name: 'fajr' as PrayerName,
        time: tomorrowFajr,
        timeUntil: tomorrowFajr.getTime() - now.getTime()
      };
    }
    
    return null;
  };

  const formatCountdown = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeString: string) => {
    // Parse the UTC time string and convert to local time
    const utcDate = new Date(timeString);
    return utcDate.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const calculateNightTimes = () => {
    if (!prayerTimes || !tomorrowPrayerTimes) return null;
    
    const now = getCurrentTime();
    const todayMaghreb = new Date(prayerTimes.maghreb);
    const tomorrowFajr = new Date(tomorrowPrayerTimes.fajr);
    
    // Determine which night we're calculating for
    let maghreb, fajr, nightLabel;
    
    if (now >= todayMaghreb) {
      // Maghreb has passed, calculate for tonight (today's maghreb to tomorrow's fajr)
      maghreb = todayMaghreb;
      fajr = tomorrowFajr;
      nightLabel = "tonight";
    } else {
      // Before maghreb, calculate for last night (yesterday's maghreb to today's fajr)
      // We need yesterday's prayer times, but for now we'll use today's fajr
      // This is a simplification - ideally we'd fetch yesterday's times
      const yesterdayMaghreb = new Date(todayMaghreb.getTime() - 24 * 60 * 60 * 1000);
      maghreb = yesterdayMaghreb;
      fajr = new Date(prayerTimes.fajr);
      nightLabel = "times from last night";
    }
    
    const nightDuration = fajr.getTime() - maghreb.getTime();
    
    // Midnight is halfway between Maghreb and Fajr
    const midnight = new Date(maghreb.getTime() + nightDuration / 2);
    
    // Last third is 2/3 of the way between Maghreb and Fajr
    const lastThird = new Date(maghreb.getTime() + nightDuration * (2/3));
    
    return { midnight, lastThird, nightLabel };
  };

  if (error) return <div>Error: {error}</div>;
  if (isLoading || !prayerTimes) return <div>Loading prayer times...</div>;

  const currentPrayer = getCurrentPrayer();
  const nextPrayer = getNextPrayer();
  const nightTimes = calculateNightTimes();

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')} 
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 
            back to dashboard
          </Button>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm">
                  <Building2 className="w-4 h-4 mr-2" /> 
                  switch mosque 
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                
                {/* Available Mosques */}
                {availableMosques.length > 0 ? (
                  availableMosques.map((mosque) => (
                    <DropdownMenuItem
                      key={mosque.id}
                      onClick={() => router.push(`/prayertimes/${mosque.id}`)}
                      className={masjidId === mosque.id ? 'bg-cottage-warm' : ''}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium">{mosque.name.toLowerCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          {mosque.city.toLowerCase()}, {mosque.country.toLowerCase()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <Building2 className="w-4 h-4 mr-2" />
                    loading mosques...
                  </DropdownMenuItem>
                )}
                
                <div className="h-px bg-border my-1" />
                
                {/* Custom Mosque Input */}
                <div className="p-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="enter mosque id"
                      className="h-8 text-sm"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          const mosqueId = e.currentTarget.value.trim();
                          if (mosqueId) {
                            router.push(`/prayertimes/${mosqueId}`);
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2 bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const mosqueId = input.value.trim();
                        if (mosqueId) {
                          router.push(`/prayertimes/${mosqueId}`);
                        }
                      }}
                    >
                      go
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              onClick={loadPrayerTimes} 
              disabled={isLoading}
              className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
              refresh
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-cottage-brown mb-2">
            prayer times
          </h1>
          <p className="text-muted-foreground">
            {masjidId === 'default' 
              ? 'default mosque (system default)' 
              : (() => {
                  const mosque = availableMosques.find(m => m.id === masjidId);
                  return mosque 
                    ? `${mosque.name.toLowerCase()} (${mosque.city.toLowerCase()}, ${mosque.country.toLowerCase()})`
                    : `masjid: ${masjidId}`;
                })()
            }
          </p>
        </div>

        {/* Prayer Times and Night Times Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Today's Prayer Times */}
          <Card className="border-cottage-warm bg-cottage-cream">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-cottage-brown" />
                              <CardTitle className="text-xl font-serif text-cottage-brown">
                today's prayer times
              </CardTitle>
              </div>
              <CardDescription>
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                          {PRAYER_ORDER.map((prayerName) => {
              const isCurrent = currentPrayer === prayerName;
              const isNext = nextPrayer?.name === prayerName;
              const hasPassed = hasPrayerPassed(prayerName);
              
              return (
                <div
                  key={prayerName}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    isCurrent 
                      ? 'border-cottage-brown bg-gradient-to-r from-cottage-brown/10 to-cottage-brown/5 shadow-cottage-brown/20' 
                      : isNext
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-green-500/20'
                      : hasPassed
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-100 shadow-red-200/20'
                      : 'border-cottage-warm bg-gradient-to-r from-background to-cottage-cream/30 hover:border-cottage-brown/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`text-3xl p-3 rounded-full ${
                      isCurrent 
                        ? 'bg-cottage-brown/20 text-cottage-brown' 
                        : isNext
                        ? 'bg-green-100 text-green-600'
                        : hasPassed
                        ? 'bg-red-100 text-red-600'
                        : 'bg-cottage-warm/50 text-cottage-brown'
                    }`}>
                      {PRAYER_ICONS[prayerName]}
                    </div>
                    <div>
                      <p className={`font-semibold text-lg ${
                        isCurrent ? 'text-cottage-brown' : isNext ? 'text-green-700' : hasPassed ? 'text-red-700' : 'text-foreground'
                      }`}>
                        {PRAYER_NAMES[prayerName]}
                      </p>
                      {isCurrent && (
                        <Badge className="bg-cottage-brown text-cottage-cream text-xs font-medium px-2 py-1 rounded-full">
                          current prayer
                        </Badge>
                      )}
                      {isNext && (
                        <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                          {countdown}
                        </Badge>
                      )}
                      {hasPassed && !isCurrent && (
                        <Badge className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          passed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className={`font-mono text-xl font-bold px-3 py-2 rounded-lg border ${
                    hasPassed && !isCurrent ? 'bg-red-50 text-red-700 border-red-200' : 'bg-background/80'
                  }`}>
                    {formatTime(prayerTimes[prayerName])}
                  </span>
                </div>
              );
            })}
            </CardContent>
          </Card>

          {/* Night Times */}
          {nightTimes && (
            <Card className="border-cottage-warm bg-cottage-cream">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-cottage-brown" />
                    <CardTitle className="text-xl font-serif text-cottage-brown">
                      night times
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs border-cottage-brown text-cottage-brown">
                      {nightTimes.nightLabel}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-cottage-brown hover:bg-cottage-brown/10"
                      onClick={() => {
                        toast({
                          title: "night time calculation",
                          description: "islamic night is from maghreb (sunset) to fajr (dawn). midnight is halfway between them, and last third is 2/3 of the way through the night. these times are blessed for tahajjud prayer and dua.",
                          duration: 5000,
                        });
                      }}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  blessed times for night prayers and supplications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-cottage-warm bg-gradient-to-r from-background to-cottage-cream/30 hover:border-cottage-brown/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl p-3 rounded-full bg-cottage-warm/50 text-cottage-brown">
                        🌙
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground">midnight</p>
                      </div>
                    </div>
                                         <span className="font-mono text-xl font-bold bg-background/80 px-3 py-2 rounded-lg border">
                       {nightTimes.midnight.toLocaleTimeString('en-US', { 
                         hour12: true, 
                         hour: '2-digit', 
                         minute: '2-digit'
                       })}
                     </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-cottage-warm bg-gradient-to-r from-background to-cottage-cream/30 hover:border-cottage-brown/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl p-3 rounded-full bg-cottage-warm/50 text-cottage-brown">
                        ⭐
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-foreground">last third</p>
                        <p className="text-sm text-muted-foreground">blessed time for dua</p>
                      </div>
                    </div>
                                         <span className="font-mono text-xl font-bold bg-background/80 px-3 py-2 rounded-lg border">
                       {nightTimes.lastThird.toLocaleTimeString('en-US', { 
                         hour12: true, 
                         hour: '2-digit', 
                         minute: '2-digit'
                       })}
                     </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}