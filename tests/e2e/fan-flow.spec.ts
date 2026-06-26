import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("fan can open public shelf and manage Hub wallet", async ({ page }) => {
  await page.goto("/liamroberts.photo/photography-kit");
  await expect(page.getByRole("heading", { name: "Photography Kit" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Share shelf/i })).toBeVisible();

  await loginAs(page, "fan", "/hub/dashboard");
  await page.goto("/hub/dashboard");
  await expect(page.getByText("$15.99")).toBeVisible();
  await page.getByRole("button", { name: "My Shares" }).click();
  await expect(page.getByText("jamie-photo")).toBeVisible();
  await page.getByRole("button", { name: "Saved" }).click();
  await expect(page.getByText("Photography Kit")).toBeVisible();
});
