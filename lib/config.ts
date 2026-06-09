import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_APP_ENV: z
    .enum(["development", "preview", "production"])
    .optional(),
});

const parsedEnv = envSchema.parse(process.env);

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

export const appConfig = {
  supabaseUrl: normalizeOrigin(parsedEnv.EXPO_PUBLIC_SUPABASE_URL ?? ""),
  supabaseAnonKey: parsedEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  environment: parsedEnv.EXPO_PUBLIC_APP_ENV ?? "development",
} as const;
