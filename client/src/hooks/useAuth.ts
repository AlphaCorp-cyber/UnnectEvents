import { useState, useEffect } from "react";
import { authService, type AuthUser } from "@/lib/authService";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signInWithFacebook: authService.signInWithFacebook.bind(authService),
    signOut: authService.signOut.bind(authService),
  };
}
