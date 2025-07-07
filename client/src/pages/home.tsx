import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import CategoryFilter from "@/components/category-filter";
import EventCard from "@/components/event-card";
import BottomNav from "@/components/bottom-nav";
import type { EventWithDetails } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/events", selectedCategory],
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
        description: "Failed to load events",
        variant: "destructive",
      });
    },
  });

  const filteredEvents = events?.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const featuredEvents = filteredEvents.slice(0, 3);
  const nearbyEvents = filteredEvents.slice(3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <Header />

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search events, workshops, parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Category Filters */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Featured Events Section */}
        {featuredEvents.length > 0 && (
          <div className="px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Featured Events</h2>
            <div className="flex space-x-4 overflow-x-auto hide-scrollbar">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="featured"
                  onClick={() => setLocation(`/event/${event.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Events Near You Section */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Events Near You</h2>
            <Button variant="ghost" size="sm" className="text-primary font-medium">
              View All
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl card-shadow p-4 animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyEvents.length > 0 ? (
            <div className="space-y-4">
              {nearbyEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onClick={() => setLocation(`/event/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No events found</p>
            </div>
          )}
        </div>

        {/* Bottom spacing for fixed navigation */}
        <div className="h-20"></div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setLocation("/create-event")}
        className="fab flex items-center justify-center"
        size="icon"
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
