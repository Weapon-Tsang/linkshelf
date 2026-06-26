import { expect, test } from "@playwright/test";

test("administrator enters through secret Google gate and reviews dashboard", async ({ page }) => {
  await page.goto("/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard");
  await expect(page.getByRole("heading", { name: "Secure administrator access" })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Unified brand operations" })).toBeVisible();
  await expect(page.getByText("FAN 1")).toBeVisible();
  await page.getByRole("button", { name: "Export CSV" }).click();
  await expect(page.getByText("CSV ready")).toBeVisible();
});
