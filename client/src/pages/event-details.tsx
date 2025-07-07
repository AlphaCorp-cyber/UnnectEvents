import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users, User, Check, Share2, Bookmark } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ["/api/events", id],
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
        description: "Failed to load event details",
        variant: "destructive",
      });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (event?.userRsvpStatus === "going") {
        await apiRequest("DELETE", `/api/events/${id}/rsvp`);
      } else {
        await apiRequest("POST", `/api/events/${id}/rsvp`, { status: "going" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: event?.userRsvpStatus === "going" ? "RSVP removed" : "RSVP confirmed",
      });
    },
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
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (event?.isSaved) {
        await apiRequest("DELETE", `/api/events/${id}/save`);
      } else {
        await apiRequest("POST", `/api/events/${id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: event?.isSaved ? "Event unsaved" : "Event saved",
      });
    },
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
        description: "Failed to save event",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Success",
          description: "Event link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")}>Go Back Home</Button>
          </div>
        </div>
      </div>
    );
  }

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

  const getPriceColor = (price: string) => {
    return price === "0" || price === "0.00" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary";
  };

  const formatPrice = (price: string) => {
    return price === "0" || price === "0.00" ? "Free" : `$${price}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="glass-effect sticky top-0 z-30 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Event Details</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-full"
            >
              <Bookmark className={`w-5 h-5 ${event.isSaved ? "text-primary fill-current" : "text-gray-600"}`} />
            </Button>
          </div>
        </div>

        {/* Event Image */}
        {event.imageUrl && (
          <div className="relative">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Event Content */}
        <div className="p-4 space-y-6">
          {/* Title and Tags */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Badge className={`${getCategoryColor(event.category)} font-medium`}>
                {event.category}
              </Badge>
              <Badge className={`${getPriceColor(event.price || "0")} font-medium`}>
                {formatPrice(event.price || "0")}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
            {event.description && (
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Event Details */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(event.date), "MMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(event.date), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{event.location}</p>
                  </div>
                </div>

                {/* Contact Information */}
                {(event.contactEmail || event.contactPhone) && (
                  <div className="col-span-2 mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                    {event.contactEmail && (
                      <p className="text-sm text-gray-600 mb-1">
                        📧 {event.contactEmail}
                      </p>
                    )}
                    {event.contactPhone && (
                      <p className="text-sm text-gray-600">
                        📞 {event.contactPhone}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Attendees</p>
                    <p className="font-medium text-gray-900">{event.attendeeCount} going</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organizer</p>
                    <p className="font-medium text-gray-900">
                      {event.organizer?.firstName || event.organizer?.email || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => rsvpMutation.mutate()}
              disabled={rsvpMutation.isPending}
              className="flex-1 py-3 font-medium"
              variant={event.userRsvpStatus === "going" ? "outline" : "default"}
            >
              {rsvpMutation.isPending ? (
                "Updating..."
              ) : event.userRsvpStatus === "going" ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Going
                </>
              ) : (
                "RSVP"
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 py-3 font-medium"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
