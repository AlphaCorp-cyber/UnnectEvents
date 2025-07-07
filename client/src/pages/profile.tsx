import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, MapPin, LogOut, Settings, Heart } from "lucide-react";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";

export default function Profile() {
  const { user } = useAuth();

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
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Events Created</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <p className="text-2xl font-bold text-gray-900">0</p>
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
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-4 h-auto"
                  onClick={() => {
                    // TODO: Implement settings
                  }}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span>Settings</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-4 h-auto"
                  onClick={() => {
                    // TODO: Implement edit profile
                  }}
                >
                  <User className="w-5 h-5 mr-3" />
                  <span>Edit Profile</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start px-6 py-4 h-auto"
                  onClick={() => {
                    // TODO: Implement location settings
                  }}
                >
                  <MapPin className="w-5 h-5 mr-3" />
                  <span>Location Preferences</span>
                </Button>
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
