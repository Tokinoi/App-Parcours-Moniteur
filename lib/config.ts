import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_APP_ENV: z
    .enum(["development", "preview", "production"])
    .optional(),
});

const parsedEnv = envSchema.parse(process.env);

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

export const appConfig = {
  apiOrigin: normalizeOrigin(
    parsedEnv.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000",
  ),
  environment: parsedEnv.EXPO_PUBLIC_APP_ENV ?? "development",
} as const;
