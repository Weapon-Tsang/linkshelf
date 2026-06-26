import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

const LOCAL_ROUTE = /^http:\/\/(?:127\.0\.0\.1|localhost):3000/;

test("creator Google development login reaches Studio", async ({ page }) => {
  await page.goto("/login?returnTo=/studio/dashboard");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(new RegExp(`${LOCAL_ROUTE.source}/studio/dashboard$`));
  await expect(page.getByRole("heading", { name: "Manage your shelves" })).toBeVisible();
});

test("Fan Hub rejects creator sessions and accepts fan sessions", async ({ page }) => {
  await loginAs(page, "creator", "/studio/dashboard");
  await page.goto("/hub/dashboard");
  await expect(page).toHaveURL(/\/forbidden$/);

  await page.context().clearCookies();
  await loginAs(page, "fan", "/hub/dashboard");
  await page.goto("/hub/dashboard");
  await expect(page.getByRole("heading", { name: "Fan rewards dashboard" })).toBeVisible();
});
