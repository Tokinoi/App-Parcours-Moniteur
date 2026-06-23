function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

export const appConfig = {
  supabaseUrl: normalizeOrigin(process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""),
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  environment: (process.env.EXPO_PUBLIC_APP_ENV as string) ?? "development",
} as const;
