import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "./firebase";


export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.handleFirebaseUser(firebaseUser);
      } else {
        this.setCurrentUser(null);
      }
    });
  }

  private async handleFirebaseUser(firebaseUser: FirebaseUser) {
    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Send the Firebase token to our backend to create/update user session
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken })
      });

      if (response.ok) {
        const userData = await response.json();
        this.setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error handling Firebase user:', error);
      this.setCurrentUser(null);
    }
  }

  private setCurrentUser(user: AuthUser | null) {
    this.currentUser = user;
    this.listeners.forEach(listener => listener(user));
  }

  public onAuthStateChanged(listener: (user: AuthUser | null) => void) {
    this.listeners.push(listener);
    // Call immediately with current state
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public async signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  public async signInWithFacebook() {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  }

  public async signOut() {
    try {
      await signOut(auth);
      // Also clear the backend session
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();