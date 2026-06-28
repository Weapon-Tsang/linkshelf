import { expect, test } from "@playwright/test";

test("administrator enters through secret Google gate and reviews dashboard", async ({ page }) => {
  await page.goto("/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard");
  await expect(page.getByRole("heading", { name: "Secure administrator access" })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Global Revenue Ledger" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Traffic Split Monitor" })).toBeVisible();
  await page.getByRole("button", { name: "Export Report" }).click();
  await expect(page.getByText("CSV ready")).toBeVisible();
});
