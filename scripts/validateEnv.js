// Simple CI config validator (keeps CI free of TS runtime deps)
const env = process.env.EXPO_PUBLIC_APP_ENV;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!env) {
  console.error(
    "EXPO_PUBLIC_APP_ENV must be set (development|preview|production)",
  );
  process.exit(1);
}

if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl)) {
  console.error(
    "EXPO_PUBLIC_SUPABASE_URL must be set and start with http:// or https://",
  );
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error("EXPO_PUBLIC_SUPABASE_ANON_KEY must be set");
  process.exit(1);
}

console.log("Environment variables look valid");
process.exit(0);
