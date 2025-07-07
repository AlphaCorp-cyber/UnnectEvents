import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Calendar, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

export default function MyEvents() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/my-events"],
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
        description: "Failed to load your events",
        variant: "destructive",
      });
    },
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      party: "bg-accent/10 text-accent",
      workshop: "bg-blue-100 text-blue-600",
      meetup: "bg-green-100 text-green-600",
      music: "bg-purple-100 text-purple-600",
      sports: "bg-orange-100 text-orange-600",
      art: "bg-indigo-100 text-indigo-600",
      food: "bg-red-100 text-red-600",
      tech: "bg-primary/10 text-primary",
    };
    return colors[category.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  const formatPrice = (price: string) => {
    return price === "0" || price === "0.00" ? "Free" : `$${price}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <Header showBackButton title="My Events" />

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="border-0 shadow-sm event-card cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Tags */}
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getCategoryColor(event.category)} text-xs font-medium`}>
                          {event.category}
                        </Badge>
                        <Badge className="bg-secondary/10 text-secondary text-xs font-medium">
                          {formatPrice(event.price || "0")}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Event Details */}
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.date), "MMM dd")}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{event.attendeeCount} going</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/event/${event.id}`)}
                          className="flex-1 text-xs"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement edit functionality
                            toast({
                              title: "Coming Soon",
                              description: "Edit functionality will be available soon",
                            });
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 text-destructive border-destructive hover:bg-destructive hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement delete functionality
                            toast({
                              title: "Coming Soon",
                              description: "Delete functionality will be available soon",
                            });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't created any events yet. Start hosting your first event!
              </p>
              <Button
                onClick={() => setLocation("/create-event")}
                className="gradient-bg text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          )}
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Floating Action Button */}
      {events && events.length > 0 && (
        <Button
          onClick={() => setLocation("/create-event")}
          className="fab flex items-center justify-center"
          size="icon"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
