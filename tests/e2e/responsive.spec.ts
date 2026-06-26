import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

const viewports = [
  { width: 390, height: 900 },
  { width: 780, height: 1000 },
  { width: 1280, height: 900 },
  { width: 2560, height: 1440 },
] as const;

for (const viewport of viewports) {
  test(`major routes avoid horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /stop killing your conversions/i })).toBeVisible();
    await expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);

    await loginAs(page, "creator", "/studio/dashboard");
    await page.goto("/studio/dashboard");
    await expect(page.getByRole("heading", { name: "Manage your shelves" })).toBeVisible();
    await expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  });
}
