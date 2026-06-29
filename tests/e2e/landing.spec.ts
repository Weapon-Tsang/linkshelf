import { expect, test } from "@playwright/test";

test("landing page renders the premium creator funnel", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: /stop killing your conversions/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Built for Top Creators" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Your Shelf" })).toHaveAttribute(
    "href",
    "/login?returnTo=%2Fstudio%2Fdashboard",
  );

  await page.screenshot({ fullPage: true, path: "test-results/landing-page.png" });
});
