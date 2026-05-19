import { appConfig } from "@/lib/config";
import { getStoredToken } from "@/lib/session";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

function joinUrl(origin: string, path: string) {
  return `${origin.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (options.auth !== false) {
    const token = await getStoredToken();

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(joinUrl(appConfig.apiOrigin, path), {
    ...options,
    headers,
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, response.status, payload);
  }

  return payload as T;
}

export async function healthCheck() {
  return apiRequest<Record<string, unknown>>("/api/health", { auth: false });
}
