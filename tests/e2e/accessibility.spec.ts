import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

test("public and authenticated primary routes have no axe violations", async ({ page }) => {
  for (const route of ["/", "/login?returnTo=/studio/dashboard", "/liamroberts.photo"]) {
    await page.goto(route);
    await expectNoAxeViolations(page);
  }

  await loginAs(page, "creator", "/studio/dashboard");
  await page.goto("/studio/dashboard");
  await expectNoAxeViolations(page);

  await page.context().clearCookies();
  await loginAs(page, "fan", "/hub/dashboard");
  await page.goto("/hub/dashboard");
  await expectNoAxeViolations(page);
});
