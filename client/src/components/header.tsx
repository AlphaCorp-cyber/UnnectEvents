import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, Bell, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { User } from "@shared/schema";

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export default function Header({ showBackButton = false, title }: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const typedUser = user as User | undefined;

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="glass-effect sticky top-0 z-30 p-4">
      <div className="flex items-center justify-between">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
              <Calendar className="text-white text-sm w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Unnect Events</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">San Francisco, CA</p>
            </div>
          </div>
        )}

        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        )}

        <div className="flex items-center space-x-3">
          {!showBackButton && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setLocation("/search")}
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
              <ThemeToggle />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-0"
            onClick={() => setLocation("/profile")}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={typedUser?.profileImageUrl || ""} alt="Profile" />
              <AvatarFallback className="text-xs font-semibold bg-gray-300 text-gray-700">
                {getInitials(typedUser?.firstName, typedUser?.lastName, typedUser?.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
