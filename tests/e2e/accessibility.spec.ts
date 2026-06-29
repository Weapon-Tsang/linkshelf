import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

async function gotoReadyForAxe(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
}

test("public and authenticated primary routes have no axe violations", async ({ page }) => {
  for (const route of ["/", "/login?returnTo=/studio/dashboard", "/liamroberts.photo"]) {
    await gotoReadyForAxe(page, route);
    await expectNoAxeViolations(page);
  }

  await loginAs(page, "creator", "/studio/dashboard");
  await gotoReadyForAxe(page, "/studio/dashboard");
  await expectNoAxeViolations(page);

  await page.context().clearCookies();
  await loginAs(page, "fan", "/hub/dashboard");
  await gotoReadyForAxe(page, "/hub/dashboard");
  await expectNoAxeViolations(page);
});
