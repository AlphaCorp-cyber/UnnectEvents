import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Users, Zap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FaFacebook, FaGoogle } from "react-icons/fa";

export default function Landing() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
          window.location.href = "/";
        } else {
          console.error("Login failed");
        }
      } else {
        const [firstName, lastName] = name.split(" ");
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });
        if (response.ok) {
          window.location.href = "/";
        } else {
          console.error("Registration failed");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleSocialAuth = (provider: "facebook" | "google") => {
    if (provider === "google") {
      window.location.href = "/api/auth/google";
    } else if (provider === "facebook") {
      window.location.href = "/api/auth/facebook";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 transition-colors">
      {/* Mobile View (default) */}
      <div className="max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm min-h-screen relative md:hidden">
        {/* Header */}
        <div className="text-center pt-12 pb-6 px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Unnect Events</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing events in your city
          </p>
        </div>

        {/* Auth Form */}
        <div className="px-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {/* Auth Mode Toggle */}
              <div className="flex mb-6">
                <Button
                  variant={authMode === "login" ? "default" : "ghost"}
                  onClick={() => setAuthMode("login")}
                  className="flex-1 rounded-r-none"
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === "signup" ? "default" : "ghost"}
                  onClick={() => setAuthMode("signup")}
                  className="flex-1 rounded-l-none"
                >
                  Sign Up
                </Button>
              </div>

              {/* Social Auth Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleSocialAuth("google")}
                  className="w-full py-3 flex items-center justify-center space-x-3 border-gray-300 hover:bg-gray-50"
                >
                  <FaGoogle className="w-5 h-5 text-red-500" />
                  <span>Continue with Google</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialAuth("facebook")}
                  className="w-full py-3 flex items-center justify-center space-x-3 border-gray-300 hover:bg-gray-50"
                >
                  <FaFacebook className="w-5 h-5 text-blue-600" />
                  <span>Continue with Facebook</span>
                </Button>

              </div>

              <div className="relative mb-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full py-3 gradient-bg text-white hover:opacity-90 transition-opacity"
                >
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              {authMode === "login" && (
                <div className="text-center mt-4">
                  <Button variant="link" className="text-sm text-gray-600">
                    Forgot your password?
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-gray-600">Local Discovery</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs text-gray-600">Easy RSVP</p>
            </div>
            <div>
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-xs text-gray-600">Create Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet View */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side - Features */}
        <div className="flex-1 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center">
              <CalendarDays className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Unnect Events</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Discover amazing events in your city and connect with your community
            </p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Discover local events near you</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Easy RSVP and event management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">Create your own events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md shadow-xl dark:bg-gray-800">
            <CardContent className="p-8">
              {/* Auth Mode Toggle */}
              <div className="flex mb-6">
                <Button
                  variant={authMode === "login" ? "default" : "ghost"}
                  onClick={() => setAuthMode("login")}
                  className="flex-1 rounded-r-none"
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === "signup" ? "default" : "ghost"}
                  onClick={() => setAuthMode("signup")}
                  className="flex-1 rounded-l-none"
                >
                  Sign Up
                </Button>
              </div>

              {/* Social Auth Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  onClick={() => handleSocialAuth("google")}
                  className="w-full py-3 flex items-center justify-center space-x-3 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FaGoogle className="w-5 h-5 text-red-500" />
                  <span>Continue with Google</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialAuth("facebook")}
                  className="w-full py-3 flex items-center justify-center space-x-3 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FaFacebook className="w-5 h-5 text-blue-600" />
                  <span>Continue with Facebook</span>
                </Button>
              </div>

              <div className="relative mb-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="name-desktop">Full Name</Label>
                    <Input
                      id="name-desktop"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email-desktop">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email-desktop"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password-desktop">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password-desktop"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <Label htmlFor="confirmPassword-desktop">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword-desktop"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full py-3 text-lg">
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </Button>

                {authMode === "login" && (
                  <div className="text-center mt-4">
                    <Button variant="link" className="text-sm text-gray-600 dark:text-gray-400">
                      Forgot your password?
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
