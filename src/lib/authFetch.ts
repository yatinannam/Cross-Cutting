import { getAccessToken } from "@/lib/auth";

export async function authFetch(input: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("Authentication required. Please sign in again.");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
