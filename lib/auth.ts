import { supabase } from "@/lib/supabase";
import type { LoginResponse, SignupResponse, UserProfile } from "@/lib/types";

export function mapSupabaseUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}): UserProfile {
  return {
    id: user.id,
    email: user.email || "",
    first_name:
      typeof user.user_metadata?.first_name === "string"
        ? user.user_metadata.first_name
        : null,
    last_name:
      typeof user.user_metadata?.last_name === "string"
        ? user.user_metadata.last_name
        : null,
    created_at: user.created_at,
  };
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("The auth server did not return a session.");

  return {
    token: data.session.access_token,
    response: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: mapSupabaseUser(data.user),
    } satisfies LoginResponse,
  };
}

export async function signup(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        first_name: payload.firstName ?? null,
        last_name: payload.lastName ?? null,
      },
    },
  });

  if (error) throw new Error(error.message);

  return {
    message: "Account created successfully",
    user: data.user ? mapSupabaseUser(data.user) : undefined,
  } satisfies SignupResponse;
}

export async function getCurrentToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function clearSession() {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<UserProfile> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(error?.message ?? "Unable to load current user");
  return mapSupabaseUser(data.user);
}
