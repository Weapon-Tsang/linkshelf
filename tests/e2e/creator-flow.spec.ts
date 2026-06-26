import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("creator can navigate dashboard, shelf manager, and editor", async ({ page }) => {
  await loginAs(page, "creator", "/studio/dashboard");

  await page.goto("/studio/dashboard");
  await expect(page.getByRole("heading", { name: "Manage your shelves" })).toBeVisible();

  await page.getByRole("link", { name: "Shelves" }).click();
  await expect(page).toHaveURL(/\/studio\/shelves$/);
  await expect(page.getByRole("heading", { name: "Your shelves" })).toBeVisible();

  await page.getByRole("link", { name: /Create New Shelf/i }).first().click();
  await expect(page).toHaveURL(/\/studio\/create$/);
  await expect(page.getByLabel("Shelf title")).toBeVisible();

  await page.goto("/studio/shelves/shelf-photography/edit");
  await expect(page.getByLabel("Shelf title")).toHaveValue("Photography Kit");
});
