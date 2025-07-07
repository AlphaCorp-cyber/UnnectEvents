import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const signInWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const signInWithFacebook = () => {
    window.location.href = "/api/auth/facebook";
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      window.location.href = "/";
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    error,
  };
}
