import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "parcours-moniteur.session-token";
const SESSION_REFRESH_TOKEN_KEY = "parcours-moniteur.session-refresh-token";

export async function getStoredToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return SecureStore.getItemAsync(SESSION_REFRESH_TOKEN_KEY);
}

export async function storeSession(
  token: string,
  refreshToken?: string | null,
) {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);

  if (typeof refreshToken === "string" && refreshToken.length > 0) {
    await SecureStore.setItemAsync(SESSION_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.deleteItemAsync(SESSION_REFRESH_TOKEN_KEY);
  }
}

export async function storeToken(token: string) {
  await storeSession(token);
}

export async function clearStoredToken() {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  await SecureStore.deleteItemAsync(SESSION_REFRESH_TOKEN_KEY);
}
