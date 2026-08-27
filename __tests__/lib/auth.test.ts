vi.mock("@/lib/config", () => ({
  appConfig: {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon-key",
    environment: "development",
  },
}));

vi.mock("@/lib/session", () => ({
  storeSession: vi.fn(),
  getStoredToken: vi.fn(),
  clearStoredToken: vi.fn(),
}));

import { getStoredToken, storeSession } from "@/lib/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, login, signup } from "@/lib/auth";

describe("lib/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login calls Supabase token endpoint and stores the returned token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              access_token: "abc123",
              refresh_token: "refresh123",
              user: { id: "1", email: "alice@example.com" },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    const result = await login("alice@example.com", "password123");

    expect(result.token).toBe("abc123");
    expect(storeSession).toHaveBeenCalledWith("abc123", "refresh123");
  });

  it("signup posts to Supabase signup endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              user: { id: "2", email: "bob@example.com" },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    const result = await signup({
      email: "bob@example.com",
      password: "validpassword123",
      firstName: "Bob",
      lastName: "Martin",
    });

    expect(result.message).toBe("Account created successfully");
    expect(result.user?.email).toBe("bob@example.com");
  });

  it("getCurrentUser reads the current Supabase auth user", async () => {
    vi.mocked(getStoredToken).mockResolvedValue("stored-token");

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: "3",
              email: "carol@example.com",
              user_metadata: { first_name: "Carol", last_name: "Tester" },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );

    const user = await getCurrentUser();

    expect(user.email).toBe("carol@example.com");
    expect(user.first_name).toBe("Carol");
  });
});
