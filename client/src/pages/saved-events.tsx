import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import EventCard from "@/components/event-card";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

export default function SavedEvents() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/saved-events"],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load saved events",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white dark:bg-background min-h-screen relative">
        {/* Header */}
        <Header showBackButton title="Saved Events" />

        {/* Content */}
        <div className="p-4 lg:px-8">
          {isLoading ? (
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                          </div>
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events && Array.isArray(events) && events.length > 0 ? (
            <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
              {events.map((event: EventWithDetails) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onClick={() => setLocation(`/event/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Events</h3>
              <p className="text-gray-600 mb-6">
                You haven't saved any events yet. Browse events and save the ones you like!
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="gradient-bg text-white"
              >
                Discover Events
              </Button>
            </div>
          )}
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}