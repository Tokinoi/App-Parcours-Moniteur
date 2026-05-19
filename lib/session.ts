import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "parcours-moniteur.session-token";

export async function getStoredToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function storeToken(token: string) {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearStoredToken() {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
