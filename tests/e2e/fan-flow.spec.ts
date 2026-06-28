import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("fan can open public shelf and manage Hub wallet", async ({ page }) => {
  await page.goto("/liamroberts.photo/photography-kit");
  await expect(page.getByRole("heading", { name: "Photography Kit" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Share shelf/i })).toBeVisible();

  await loginAs(page, "fan", "/hub/dashboard");
  await page.goto("/hub/dashboard");
  await expect(page.getByText("$128.50").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeVisible();
  await expect(page.getByText("jamie-photo")).toBeVisible();
  await expect(page.getByText("jamie-travel")).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Saved Collections" })
      .getByRole("heading", { name: "Outdoor Adventure" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Saved Collections" })
      .getByRole("heading", { name: "Dream Home" }),
  ).toBeVisible();
});

test("post-auth share return opens the share modal on the public shelf", async ({ page }) => {
  await page.goto("/liamroberts.photo/photography-kit?share=jamie-photo&shareModal=1");

  await expect(page.getByRole("dialog", { name: "Share Shelf" })).toBeVisible();
  await expect(page.getByText("/liamroberts.photo/photography-kit?share=jamie-photo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Share on X" })).toBeVisible();
});
