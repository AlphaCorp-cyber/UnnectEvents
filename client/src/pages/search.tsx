import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, MapPin, Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import EventCard from "@/components/event-card";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

export default function SearchPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: events, isLoading, error } = useQuery<EventWithDetails[]>({
    queryKey: ["/api/events", selectedCategory === "all" ? undefined : selectedCategory],
  });

  // Handle errors
  if (error && !isLoading) {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
    toast({
      title: "Error",
      description: "Failed to load events",
      variant: "destructive",
    });
  }

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "party", label: "🎉 Parties" },
    { value: "workshop", label: "🎓 Workshops" },
    { value: "meetup", label: "🤝 Meetups" },
    { value: "music", label: "🎵 Music" },
    { value: "sports", label: "⚽ Sports" },
    { value: "art", label: "🎨 Art" },
    { value: "food", label: "🍕 Food" },
    { value: "tech", label: "💻 Tech" },
  ];

  const filterEvents = (): EventWithDetails[] => {
    if (!events || !Array.isArray(events)) return [];

    return events.filter((event: EventWithDetails) => {
      // Text search
      const matchesSearch = searchQuery === "" || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;

      // Price filter
      const eventPrice = parseFloat(event.price || "0");
      const matchesPrice = priceFilter === "all" || 
        (priceFilter === "free" && eventPrice === 0) ||
        (priceFilter === "paid" && eventPrice > 0);

      // Date filter
      const eventDate = new Date(event.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const matchesDate = dateFilter === "all" ||
        (dateFilter === "today" && eventDate.toDateString() === today.toDateString()) ||
        (dateFilter === "tomorrow" && eventDate.toDateString() === tomorrow.toDateString()) ||
        (dateFilter === "this_week" && eventDate <= nextWeek && eventDate >= today);

      return matchesSearch && matchesCategory && matchesPrice && matchesDate;
    });
  };

  const filteredEvents = filterEvents();
  const hasActiveFilters = selectedCategory !== "all" || priceFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceFilter("all");
    setDateFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {/* Header */}
        <Header showBackButton title="Search Events" />

        {/* Search Bar */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search events, locations, organizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {[selectedCategory !== "all", priceFilter !== "all", dateFilter !== "all"].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price</label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="free">Free Events</SelectItem>
                      <SelectItem value="paid">Paid Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Date</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="px-4 pb-4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : "All Events"}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Events List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                          </div>
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event: EventWithDetails) => (
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
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || hasActiveFilters 
                  ? "Try adjusting your search or filters to find more events."
                  : "No events are available right now. Check back later!"
                }
              </p>
              {(searchQuery || hasActiveFilters) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mr-3"
                >
                  Clear Filters
                </Button>
              )}
              <Button
                onClick={() => setLocation("/")}
                className="gradient-bg text-white"
              >
                Browse All Events
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