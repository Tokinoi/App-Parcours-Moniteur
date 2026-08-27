# Parcours Moniteur - App

## Setup

```bash
npm install
```

Create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_APP_ENV=development
```

## Development

```bash
npx expo start
```

## Build & Submit

### Build both platforms

```bash
eas build --platform all --profile production
```

### Build one platform

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submit to stores

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### Build + auto-submit in one command

```bash
eas build --platform ios --profile production --auto-submit
eas build --platform android --profile production --auto-submit
```

### Submit latest existing build (no rebuild)

```bash
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest
```

## EAS Environment Variables

List production env vars:

```bash
eas env:list --environment production
```

Add a new variable:

```bash
eas env:create --name VAR_NAME --value "value" --environment production --visibility plaintext
```

Delete a variable:

```bash
eas env:delete production --variable-name VAR_NAME
```

## Credentials

View current credentials:

```bash
eas credentials --platform ios
eas credentials --platform android
```

## CI/CD

Pushing to `main` automatically:
1. Runs checks (typecheck, config validation, tests)
2. Builds Android + iOS
3. Submits to Play Store + App Store

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play service account JSON |
| `ASC_API_KEY_ISSUER_ID` | App Store Connect API issuer ID |
| `ASC_API_KEY_ID` | App Store Connect API key ID |
| `ASC_API_KEY_P8` | App Store Connect API key (.p8 contents) |

## Checks

```bash
npm run typecheck
npm run config:validate
npm run ci:test
```
