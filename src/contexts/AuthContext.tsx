import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  initCrypto,
  generateKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  storeEncryptedPrivateKey,
  getEncryptedPrivateKey,
  clearStoredKeys,
} from '@/lib/crypto';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  privateKey: string | null;
  loading: boolean;
  signUp: (email: string, password: string, passphrase: string) => Promise<void>;
  signIn: (email: string, password: string, passphrase: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      await initCrypto();

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        }
      );

      // Check for existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, passphrase: string) => {
    try {
      // Generate keypair
      const keyPair = await generateKeyPair();

      // Encrypt private key with passphrase
      const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKey, passphrase);

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Store encrypted private key
        storeEncryptedPrivateKey(encryptedPrivateKey);

        // Create user profile with public key
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          public_key: keyPair.publicKey,
          username: email.split('@')[0],
        });

        if (profileError) throw profileError;

        // Decrypt and store private key in memory
        setPrivateKey(keyPair.privateKey);

        toast({
          title: 'Account created!',
          description: 'Welcome to Bonfire.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string, passphrase: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get encrypted private key from localStorage
      const encryptedKey = getEncryptedPrivateKey();
      if (!encryptedKey) {
        throw new Error('No encrypted key found. Please sign up first.');
      }

      // Decrypt private key
      const decryptedPrivateKey = await decryptPrivateKey(encryptedKey, passphrase);
      setPrivateKey(decryptedPrivateKey);

      toast({
        title: 'Welcome back!',
        description: 'Signed in successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setPrivateKey(null);
      clearStoredKeys();

      toast({
        title: 'Signed out',
        description: 'See you next time!',
      });
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        privateKey,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
