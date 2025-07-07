import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart, Calendar, User } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/saved-events", icon: Heart, label: "Saved" },
    { path: "/my-events", icon: Calendar, label: "My Events" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bottom-nav">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-4 h-auto ${
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
