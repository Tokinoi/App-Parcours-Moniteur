import { apiRequest } from "@/lib/api";
import { clearStoredToken, getStoredToken, storeToken } from "@/lib/session";

type TokenPayload = {
  token?: string;
  jwt?: string;
  accessToken?: string;
  [key: string]: unknown;
};

function extractToken(payload: TokenPayload) {
  const token = payload.token ?? payload.jwt ?? payload.accessToken;

  return typeof token === "string" ? token : null;
}

export async function requestCode(email: string) {
  return apiRequest<{ message?: string }>("/api/auth/request-code", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(email: string, code: string) {
  const response = await apiRequest<TokenPayload>("/api/auth/verify-code", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, code }),
  });
  const token = extractToken(response);

  if (!token) {
    throw new Error("The backend did not return a session token.");
  }

  await storeToken(token);

  return {
    token,
    response,
  };
}

export async function getCurrentToken() {
  return getStoredToken();
}

export async function clearSession() {
  await clearStoredToken();
}
