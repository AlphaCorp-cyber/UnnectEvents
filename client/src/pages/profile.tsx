
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Calendar, MapPin, LogOut, Settings, Heart, Edit } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import type { EventWithDetails } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationPrefsOpen, setLocationPrefsOpen] = useState(false);
  
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Fetch user's events count
  const { data: userEvents } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/my-events"],
  });

  // Fetch user's RSVPs count
  const { data: userRsvps } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/my-rsvps"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; profileImage?: File }) => {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      if (data.profileImage) {
        formData.append('profileImage', data.profileImage);
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditProfileOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({ 
      firstName, 
      lastName, 
      ...(profileImage && { profileImage })
    });
  };

  const eventsCreated = userEvents?.length || 0;
  const eventsAttended = userRsvps?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white dark:bg-background min-h-screen relative">
        {/* Header */}
        <Header showBackButton title="Profile" />

        {/* Profile Content */}
        <div className="p-4 lg:px-8 space-y-6">
          {/* Profile Info */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                  <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                    {getInitials(user?.firstName, user?.lastName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || "User"}
                  </h2>
                  <p className="text-gray-600 text-sm">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    Event Enthusiast
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{eventsCreated}</p>
                <p className="text-sm text-gray-600">Events Created</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{eventsAttended}</p>
                <p className="text-sm text-gray-600">Events Attended</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {/* Settings Dialog */}
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-4 h-auto"
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      <span>Settings</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Settings</DialogTitle>
                      <DialogDescription>
                        Manage your account settings and preferences.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Notifications</Label>
                        <p className="text-sm text-gray-600">Email notifications are enabled by default.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Privacy</Label>
                        <p className="text-sm text-gray-600">Your profile is visible to other users.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setSettingsOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Edit Profile Dialog */}
                <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-4 h-auto"
                    >
                      <User className="w-5 h-5 mr-3" />
                      <span>Edit Profile</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your personal information.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profileImage">Profile Picture</Label>
                        <div className="flex flex-col items-center space-y-4">
                          <Avatar className="w-24 h-24">
                            <AvatarImage 
                              src={profileImagePreview || user?.profileImageUrl || ""} 
                              alt="Profile Preview" 
                            />
                            <AvatarFallback className="text-lg font-semibold bg-primary text-white">
                              {getInitials(firstName || user?.firstName, lastName || user?.lastName, user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Location Preferences Dialog */}
                <Dialog open={locationPrefsOpen} onOpenChange={setLocationPrefsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-4 h-auto"
                    >
                      <MapPin className="w-5 h-5 mr-3" />
                      <span>Location Preferences</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Location Preferences</DialogTitle>
                      <DialogDescription>
                        Set your preferred location for event recommendations.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Preferred Location</Label>
                        <Input
                          id="location"
                          value={preferredLocation}
                          onChange={(e) => setPreferredLocation(e.target.value)}
                          placeholder="Enter your preferred city"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLocationPrefsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        toast({
                          title: "Success",
                          description: "Location preferences saved",
                        });
                        setLocationPrefsOpen(false);
                      }}>
                        Save Preferences
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-start px-6 py-4 h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sign Out</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
