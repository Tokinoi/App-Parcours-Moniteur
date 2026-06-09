import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { mapSupabaseUser, signup } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { LoginResponse, SignupResponse, UserProfile } from "@/lib/types";

type SignInResult = {
  token: string;
  response: LoginResponse;
};

type SessionContextValue = {
  ready: boolean;
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<SignupResponse>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Load persisted session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setReady(true);
    });

    // Stay in sync with token refreshes, sign-outs, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setToken(session?.access_token ?? null);
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("No session returned.");

    return {
      token: data.session.access_token,
      response: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        user: mapSupabaseUser(data.user),
      },
    };
  }

  async function handleSignUp(payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return signup(payload);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      isAuthenticated: Boolean(token),
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
    }),
    [ready, token, user],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return context;
}
