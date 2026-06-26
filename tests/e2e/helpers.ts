import { expect, type Page } from "@playwright/test";

export const BASE_URL = "http://127.0.0.1:3000";

export async function loginAs(
  page: Page,
  role: "creator" | "fan",
  returnTo: string,
) {
  const response = await page.request.post("/api/auth/google", {
    form: { role, returnTo },
    headers: { origin: BASE_URL },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
}
