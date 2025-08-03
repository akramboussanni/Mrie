'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Save, 
  Building2, 
  Trash2, 
  Edit, 
  Check, 
  X 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { settingsService } from "@/lib/settings";
import { prayerTimesService, MosqueInfo } from "@/lib/prayertimes";

export default function AppSettings() {
  const [defaultMasjid, setDefaultMasjid] = useState("");
  const [availableMosques, setAvailableMosques] = useState<MosqueInfo[]>([]);
  const [customMosqueId, setCustomMosqueId] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Mosque management dialogs
  const [showAddMosqueDialog, setShowAddMosqueDialog] = useState(false);
  const [showEditMosqueDialog, setShowEditMosqueDialog] = useState(false);
  const [editingMosque, setEditingMosque] = useState<MosqueInfo | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    country: "",
    city: "",
    timezone: ""
  });
  
  // New mosque validation
  const [newMosqueId, setNewMosqueId] = useState("");
  const [isValidatingMosque, setIsValidatingMosque] = useState(false);
  const [mosqueValidationResult, setMosqueValidationResult] = useState<{valid: boolean, error?: string} | null>(null);
  
  const { toast } = useToast();

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const currentMasjid = await settingsService.getDefaultMasjid();
      setDefaultMasjid(currentMasjid || "");
    } catch (error) {
      console.error('failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadAvailableMosques = async () => {
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
  };

  const validateNewMosque = async () => {
    if (!newMosqueId.trim()) return;
    
    setIsValidatingMosque(true);
    setMosqueValidationResult(null);
    
    try {
      const result = await prayerTimesService.validateMosque(newMosqueId.trim());
      setMosqueValidationResult(result);
      
      if (result.valid) {
        toast({
          title: "Mosque validated",
          description: "This mosque ID is valid and accessible",
        });
      } else {
        toast({
          title: "Invalid mosque ID",
          description: result.error || "This mosque ID is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      setMosqueValidationResult({ valid: false, error: "Failed to validate mosque" });
      toast({
        title: "Validation failed",
        description: "Could not validate the mosque ID",
        variant: "destructive",
      });
    } finally {
      setIsValidatingMosque(false);
    }
  };

  const addNewMosque = async () => {
    if (!newMosqueId.trim() || !mosqueValidationResult?.valid) return;
    
    try {
      const mosqueInfo = await prayerTimesService.getMosqueInfo(newMosqueId.trim());
      
      // Create the mosque in the backend with custom display info
      const createdMosque = await prayerTimesService.createMosque({
        id: mosqueInfo.id,
        name: editFormData.name || mosqueInfo.name,
        country: editFormData.country || mosqueInfo.country,
        city: editFormData.city || mosqueInfo.city,
        timezone: editFormData.timezone || mosqueInfo.timezone,
      });
      
      // Reload the mosque list
      await loadAvailableMosques();
      
      setNewMosqueId("");
      setMosqueValidationResult(null);
      setEditFormData({ name: "", country: "", city: "", timezone: "" });
      
      toast({
        title: "Mosque added",
        description: `${createdMosque.name} has been added to the available mosques`,
      });
    } catch (error) {
      toast({
        title: "Failed to add mosque",
        description: "Could not add the mosque to the list",
        variant: "destructive",
      });
    }
  };

  const removeMosque = async (mosqueId: string) => {
    try {
      await prayerTimesService.deleteMosque(mosqueId);
      
      // Reload the mosque list
      await loadAvailableMosques();
      
      toast({
        title: "Mosque removed",
        description: "The mosque has been removed from the available list",
      });
    } catch (error) {
      toast({
        title: "Failed to remove mosque",
        description: "Could not remove the mosque from the list",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (mosque: MosqueInfo) => {
    setEditingMosque(mosque);
    setEditFormData({
      name: mosque.name,
      country: mosque.country,
      city: mosque.city,
      timezone: mosque.timezone || ""
    });
    setShowEditMosqueDialog(true);
  };

  const handleEditMosque = async () => {
    if (!editingMosque) return;
    
    try {
      // Call the backend API to update the mosque
      await prayerTimesService.updateMosque(editingMosque.id, {
        name: editFormData.name,
        country: editFormData.country,
        city: editFormData.city,
        timezone: editFormData.timezone
      });
      
      // Reload the mosques list to get the updated data
      await loadAvailableMosques();
      
      setShowEditMosqueDialog(false);
      setEditingMosque(null);
      
      toast({
        title: "Mosque updated",
        description: "The mosque information has been updated",
      });
    } catch (error) {
      toast({
        title: "Failed to update mosque",
        description: "Could not update the mosque information",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    if (isSavingSettings) return;

    setIsSavingSettings(true);
    
    try {
      await settingsService.updateDefaultMasjid(defaultMasjid);
      toast({
        title: "settings saved",
        description: "default masjid has been updated",
      });
    } catch (error) {
      toast({
        title: "failed to save settings",
        description: error instanceof Error ? error.message : "please try again",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadAvailableMosques();
  }, []);

  return (
    <Card className="border-cottage-warm bg-cottage-cream card-hover-lift mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-serif text-cottage-brown">
              app settings
            </CardTitle>
            <CardDescription>
              manage system-wide configuration
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showAddMosqueDialog} onOpenChange={setShowAddMosqueDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-cottage-warm text-cottage-brown hover:bg-cottage-warm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Mosque
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cottage-cream border-cottage-warm">
                <DialogHeader>
                  <DialogTitle className="text-cottage-brown">Add New Mosque</DialogTitle>
                  <DialogDescription>
                    Enter a mosque ID to validate and add it to the available list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newMosqueId" className="text-cottage-brown">
                      Mosque ID
                    </Label>
                    <Input
                      id="newMosqueId"
                      type="text"
                      placeholder="e.g., masjid123"
                      value={newMosqueId}
                      onChange={(e) => setNewMosqueId(e.target.value)}
                      className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          validateNewMosque();
                        }
                      }}
                    />
                  </div>
                  
                  {mosqueValidationResult?.valid && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="mosqueName" className="text-cottage-brown">
                            Display Name
                          </Label>
                          <Input
                            id="mosqueName"
                            type="text"
                            placeholder="e.g., Grand Mosque"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mosqueCountry" className="text-cottage-brown">
                            Country
                          </Label>
                          <Input
                            id="mosqueCountry"
                            type="text"
                            placeholder="e.g., France"
                            value={editFormData.country}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="mosqueCity" className="text-cottage-brown">
                            City
                          </Label>
                          <Input
                            id="mosqueCity"
                            type="text"
                            placeholder="e.g., Paris"
                            value={editFormData.city}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mosqueTimezone" className="text-cottage-brown">
                            Timezone
                          </Label>
                          <Input
                            id="mosqueTimezone"
                            type="text"
                            placeholder="e.g., Europe/Paris"
                            value={editFormData.timezone}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, timezone: e.target.value }))}
                            className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {mosqueValidationResult && (
                    <div className={`p-3 rounded-lg border ${
                      mosqueValidationResult.valid 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {mosqueValidationResult.valid ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <div>
                          <p className="font-medium">
                            {mosqueValidationResult.valid ? "Valid Mosque" : "Invalid Mosque"}
                          </p>
                          {mosqueValidationResult.error && (
                            <p className="text-sm opacity-75">{mosqueValidationResult.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddMosqueDialog(false);
                      setNewMosqueId("");
                      setMosqueValidationResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={validateNewMosque}
                    disabled={!newMosqueId.trim() || isValidatingMosque}
                    className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
                  >
                    {isValidatingMosque ? "Validating..." : "Validate"}
                  </Button>
                  {mosqueValidationResult?.valid && (
                    <Button
                      onClick={() => {
                        addNewMosque();
                        setShowAddMosqueDialog(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Mosque
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit Mosque Dialog */}
            <Dialog open={showEditMosqueDialog} onOpenChange={setShowEditMosqueDialog}>
              <DialogContent className="bg-cottage-cream border-cottage-warm">
                <DialogHeader>
                  <DialogTitle className="text-cottage-brown">Edit Mosque</DialogTitle>
                  <DialogDescription>
                    Update the display information for this mosque
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="editMosqueName" className="text-cottage-brown">
                        Display Name
                      </Label>
                      <Input
                        id="editMosqueName"
                        type="text"
                        placeholder="e.g., Grand Mosque"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editMosqueCountry" className="text-cottage-brown">
                        Country
                      </Label>
                      <Input
                        id="editMosqueCountry"
                        type="text"
                        placeholder="e.g., France"
                        value={editFormData.country}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="editMosqueCity" className="text-cottage-brown">
                        City
                      </Label>
                      <Input
                        id="editMosqueCity"
                        type="text"
                        placeholder="e.g., Paris"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editMosqueTimezone" className="text-cottage-brown">
                        Timezone
                      </Label>
                      <Input
                        id="editMosqueTimezone"
                        type="text"
                        placeholder="e.g., Europe/Paris"
                        value={editFormData.timezone}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditMosqueDialog(false);
                      setEditingMosque(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditMosque}
                    className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Default Masjid Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-cottage-brown font-medium">
                default masjid
              </Label>
              <p className="text-xs text-muted-foreground">
                this setting affects all users' default prayer times
              </p>
            </div>
            
            {/* Available Mosques Grid */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                available mosques ({availableMosques.length})
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableMosques.map((mosque) => (
                  <div
                    key={mosque.id}
                    className={`relative p-4 border rounded-lg transition-all ${
                      defaultMasjid === mosque.id 
                        ? 'border-cottage-brown bg-cottage-brown/10' 
                        : 'border-cottage-warm bg-background hover:border-cottage-brown/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Building2 className="w-5 h-5 text-cottage-brown flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-cottage-brown truncate">{mosque.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {mosque.city}, {mosque.country}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {mosque.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {defaultMasjid === mosque.id && (
                          <Badge className="bg-cottage-brown text-cottage-cream text-xs">
                            Default
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultMasjid(mosque.id)}
                          className="text-cottage-brown hover:bg-cottage-warm"
                          disabled={isLoadingSettings || isSavingSettings}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(mosque)}
                          className="text-cottage-brown hover:bg-cottage-warm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={defaultMasjid === mosque.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-cottage-cream border-cottage-warm">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-cottage-brown">
                                Remove Mosque
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{mosque.name}" from the available mosques? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-cottage-warm">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMosque(mosque.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {availableMosques.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No mosques available</p>
                  <p className="text-sm">Add a mosque using the button above</p>
                </div>
              )}
            </div>

            {/* Custom Mosque ID */}
            <div className="space-y-2">
              <Label htmlFor="customMosqueId" className="text-sm text-muted-foreground">
                or enter custom mosque id
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="customMosqueId"
                  type="text"
                  placeholder="enter mosque id (e.g., masjid123)"
                  value={customMosqueId}
                  onChange={(e) => setCustomMosqueId(e.target.value)}
                  className="bg-cottage-cream border-cottage-warm focus:border-cottage-brown"
                  disabled={isLoadingSettings || isSavingSettings}
                />
                <Button
                  onClick={() => {
                    if (customMosqueId.trim()) {
                      setDefaultMasjid(customMosqueId.trim());
                      setCustomMosqueId("");
                    }
                  }}
                  className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream"
                  disabled={!customMosqueId.trim() || isLoadingSettings || isSavingSettings}
                >
                  Set
                </Button>
              </div>
            </div>

            {/* Current Selection */}
            {defaultMasjid && (
              <div className="p-3 bg-cottage-warm/30 rounded-lg border border-cottage-warm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-cottage-brown" />
                    <span className="font-medium text-cottage-brown">Current Default:</span>
                    <span className="font-mono text-sm">{defaultMasjid}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultMasjid("")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isLoadingSettings || isSavingSettings}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveSettings}
            className="bg-cottage-brown hover:bg-cottage-brown/90 text-cottage-cream btn-hover-scale"
            disabled={isLoadingSettings || isSavingSettings}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingSettings ? "saving..." : "save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 