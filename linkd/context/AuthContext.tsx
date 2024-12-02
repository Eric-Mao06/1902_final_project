import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { API_URL } from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_CLIENT_ID = "";

interface User {
  email: string;
  name: string;
  picture?: string;
  linkedin_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts) {
        resolve();
      } else {
        reject(new Error('Google authentication script failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google authentication script'));
    };

    document.head.appendChild(script);
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('Starting Google Sign In process...');
      
      // Ensure Google script is loaded
      await loadGoogleScript();
      
      // Additional check for Google accounts
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google authentication is not available');
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          if (response.access_token) {
            try {
              // Get user info from Google
              const googleUser = await fetch(
                `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`
              );
              const userData = await googleUser.json();

              // Set user state with combined Google data
              setUser({
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
                linkedin_url: undefined // Will be updated later
              });

              // Redirect based on whether LinkedIn URL is set
              if (!userData.linkedin_url) {
                await Linking.openURL('/linkedin');
              } else {
                await Linking.openURL('/');
              }
            } catch (userFetchError) {
              console.error('Failed to fetch user data:', userFetchError);
              throw userFetchError;
            }
          } else {
            throw new Error('No access token received');
          }
        }
      });

      // Trigger the OAuth flow
      client.requestAccessToken();
    } catch (error) {
      console.error('Google Sign In Error:', error);
      // Optionally set an error state or show a user-friendly error message
      setLoading(false);
      throw error;
    } finally {
      // Ensure loading state is reset
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      await Linking.openURL('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
