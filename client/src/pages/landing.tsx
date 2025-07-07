import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm min-h-screen relative">
        {/* Header */}
        <div className="text-center pt-20 pb-8 px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Unnect Events</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover amazing events in your city and connect with like-minded people
          </p>
        </div>

        {/* Features */}
        <div className="px-6 mb-12">
          <div className="grid gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Local Discovery</h3>
                    <p className="text-sm text-gray-600">Find events happening near you</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Easy RSVP</h3>
                    <p className="text-sm text-gray-600">Join events with one tap</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Events</h3>
                    <p className="text-sm text-gray-600">Host your own gatherings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-8">
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="w-full py-4 text-lg font-semibold gradient-bg text-white hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
          <p className="text-center text-sm text-gray-500 mt-4">
            Join thousands of event enthusiasts
          </p>
        </div>
      </div>
    </div>
  );
}
