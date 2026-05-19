// Simple CI config validator (keeps CI free of TS runtime deps)
const url = process.env.EXPO_PUBLIC_API_URL;
const env = process.env.EXPO_PUBLIC_APP_ENV;

if (!url || !/^https?:\/\//.test(url)) {
  console.error('EXPO_PUBLIC_API_URL must be set and start with http:// or https://');
  process.exit(1);
}

if (!env) {
  console.error('EXPO_PUBLIC_APP_ENV must be set (development|preview|production)');
  process.exit(1);
}

console.log('Environment variables look valid');
process.exit(0);
