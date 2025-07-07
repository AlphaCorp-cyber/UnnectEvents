import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Bookmark, BookmarkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

interface EventCardProps {
  event: EventWithDetails;
  variant?: "featured" | "compact";
  onClick?: () => void;
}

export default function EventCard({ event, variant = "compact", onClick }: EventCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (event.isSaved) {
        await apiRequest("DELETE", `/api/events/${event.id}/save`);
      } else {
        await apiRequest("POST", `/api/events/${event.id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: event.isSaved ? "Event unsaved" : "Event saved",
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

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (event.userRsvpStatus === "going") {
        await apiRequest("DELETE", `/api/events/${event.id}/rsvp`);
      } else {
        await apiRequest("POST", `/api/events/${event.id}/rsvp`, { status: "going" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: event.userRsvpStatus === "going" ? "RSVP removed" : "RSVP confirmed",
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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveMutation.mutate();
  };

  const handleRsvp = (e: React.MouseEvent) => {
    e.stopPropagation();
    rsvpMutation.mutate();
  };

  if (variant === "featured") {
    return (
      <div className="event-card bg-white rounded-xl card-shadow min-w-[280px] overflow-hidden cursor-pointer" onClick={onClick}>
        {event.imageUrl && (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-32 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={`${getCategoryColor(event.category)} text-xs font-medium`}>
              {event.category}
            </Badge>
            <Badge className={`${getPriceColor(event.price || "0")} text-xs font-medium`}>
              {formatPrice(event.price || "0")}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{format(new Date(event.date), "MMM dd, h:mm a")}</span>
            <MapPin className="w-3 h-3 ml-3 mr-1" />
            <span>{event.city || event.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {/* Mock attendee avatars */}
                <Avatar className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">A</AvatarFallback>
                </Avatar>
                <Avatar className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">B</AvatarFallback>
                </Avatar>
                <Avatar className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">C</AvatarFallback>
                </Avatar>
              </div>
              <span className="ml-2 text-xs text-gray-500">+{event.attendeeCount} going</span>
            </div>
            <Button
              size="sm"
              onClick={handleRsvp}
              disabled={rsvpMutation.isPending}
              variant={event.userRsvpStatus === "going" ? "outline" : "default"}
              className="text-xs font-medium"
            >
              {event.userRsvpStatus === "going" ? "Going" : "RSVP"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-card bg-white rounded-xl card-shadow p-4 cursor-pointer" onClick={onClick}>
      <div className="flex space-x-3">
        {event.imageUrl && (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Badge className={`${getCategoryColor(event.category)} text-xs font-medium`}>
              {event.category}
            </Badge>
            <Badge className={`${getPriceColor(event.price || "0")} text-xs font-medium`}>
              {formatPrice(event.price || "0")}
            </Badge>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{format(new Date(event.date), "MMM dd, h:mm a")}</span>
            <MapPin className="w-3 h-3 ml-3 mr-1" />
            <span>{event.city || event.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-8 h-8 rounded-full"
          >
            <Bookmark className={`w-4 h-4 ${event.isSaved ? "text-primary fill-current" : "text-gray-400"}`} />
          </Button>
          <span className="text-xs text-gray-500">{event.attendeeCount} going</span>
        </div>
      </div>
    </div>
  );
}
