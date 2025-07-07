
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, MapPin, FileImage, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";

const editEventSchema = insertEventSchema.partial();
type EditEventData = z.infer<typeof editEventSchema>;

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery({
    queryKey: [`/api/events/${id}`],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditEventData>({
    resolver: zodResolver(editEventSchema),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditEventData) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      setLocation(`/event/${id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-4">Event not found</div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: EditEventData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto bg-white dark:bg-background min-h-screen">
        {/* Header */}
        <div className="glass-effect sticky top-0 z-30 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/event/${id}`)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Edit Event</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 lg:px-8 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  defaultValue={event.title}
                  {...register("title")}
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={event.description || ""}
                  {...register("description")}
                  placeholder="Describe your event"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={event.category} onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="party">🎉 Party</SelectItem>
                    <SelectItem value="workshop">🛠️ Workshop</SelectItem>
                    <SelectItem value="meetup">🤝 Meetup</SelectItem>
                    <SelectItem value="music">🎵 Music</SelectItem>
                    <SelectItem value="sports">⚽ Sports</SelectItem>
                    <SelectItem value="art">🎨 Art</SelectItem>
                    <SelectItem value="food">🍕 Food</SelectItem>
                    <SelectItem value="tech">💻 Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  defaultValue={event.location}
                  {...register("location")}
                  placeholder="Event location"
                />
              </div>

              <div>
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  defaultValue={new Date(event.date).toISOString().slice(0, 16)}
                  {...register("date")}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full gradient-bg text-white py-3"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update Event"}
          </Button>
        </form>
      </div>
    </div>
  );
}
