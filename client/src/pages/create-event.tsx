import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema } from "@shared/schema";

const createEventSchema = insertEventSchema.extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
}).omit({ organizerId: true });

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function CreateEvent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      category: "",
      price: "0",
      maxAttendees: undefined,
      imageUrl: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      // Combine date and time
      const { date, time, ...eventData } = data;
      const dateTime = new Date(`${date}T${time}`);
      
      await apiRequest("POST", "/api/events", {
        ...eventData,
        date: dateTime.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      setLocation("/");
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
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createEventMutation.mutate(data);
  };

  const categories = [
    { value: "party", label: "🎉 Party" },
    { value: "workshop", label: "🎓 Workshop" },
    { value: "meetup", label: "🤝 Meetup" },
    { value: "music", label: "🎵 Music" },
    { value: "sports", label: "⚽ Sports" },
    { value: "art", label: "🎨 Art" },
    { value: "food", label: "🍕 Food" },
    { value: "tech", label: "💻 Tech" },
  ];

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
            <h1 className="text-lg font-semibold">Create Event</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span>Event Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Event Title</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter event title"
                            {...field}
                            className="py-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your event..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Date</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              {...field}
                              className="py-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="py-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Location</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter event location"
                            {...field}
                            className="py-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Tag className="w-4 h-4" />
                          <span>Category</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="py-3">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Price</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              {...field}
                              className="py-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxAttendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Max Attendees</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="50"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="py-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            className="py-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                      className="flex-1 py-3"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createEventMutation.isPending}
                      className="flex-1 py-3 gradient-bg text-white"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
