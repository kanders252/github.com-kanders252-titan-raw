import { expect, test } from "@playwright/test";
import { login, uniqueEmail } from "./helpers";

test("@mobile no horizontal scroll at 375px on every main page", async ({ page }) => {
  await login(page, uniqueEmail("mobile"));
  const recipeHref = await (async () => {
    await page.goto("/recipes");
    return page.getByTestId("recipe-card").first().getAttribute("href");
  })();
  const planHref = await (async () => {
    await page.goto("/plans");
    return page.getByTestId("plan-card").first().getAttribute("href");
  })();

  for (const path of ["/", "/daily", "/recipes", recipeHref!, "/plans", planHref!, "/plans/new", "/login"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
  }
});
