import { expect, test } from "@playwright/test";
import { login, uniqueEmail } from "./helpers";

test.describe("critical flows", () => {
  test("1. login → /daily → check Breakfast → HOME ring shows 1/8", async ({ page }) => {
    await login(page, uniqueEmail("daily"));

    await page.goto("/");
    await expect(page.getByTestId("progress-count")).toHaveText("0/8");

    await page.goto("/daily");
    const breakfast = page.getByTestId("slot-checkbox-BREAKFAST");
    await expect(breakfast).toBeVisible();

    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/daily"));
    await breakfast.click();
    await saved;
    await expect(breakfast).toHaveAttribute("data-state", "checked");
    await expect(page.getByTestId("daily-count")).toHaveText("1/8");

    await page.goto("/");
    await expect(page.getByTestId("progress-count")).toHaveText("1/8");
    await expect(page.getByTestId("progress-ring")).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByTestId("next-slot")).toHaveText("Infused Water");
  });

  test("2. /plans/new → 3-day plan with all 8 slots on day 1 → appears in /plans", async ({ page }) => {
    await login(page, uniqueEmail("plan"), "/plans/new");
    await expect(page).toHaveURL(/\/plans\/new/);

    const name = `E2E Abundance ${Date.now()}`;
    await page.waitForLoadState("networkidle"); // let the client form hydrate before typing
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Duration (days)").fill("3");
    await expect(page.getByLabel("Name")).toHaveValue(name);

    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Detox" }).click();

    await expect(page.getByTestId("plan-day-3")).toBeVisible();
    await expect(page.getByTestId("plan-day-4")).toHaveCount(0);

    const slots = ["INFUSED_WATER", "BREAKFAST", "MORNING_SNACK", "LUNCH", "AFTERNOON_SNACK", "DINNER", "EVENING_SNACK", "DESSERT"];
    for (const [i, slot] of slots.entries()) {
      await page.getByTestId(`select-1-${slot}`).selectOption({ index: i + 1 });
    }
    await expect(page.getByText("8 moments planned")).toBeVisible();

    await page.getByTestId("create-plan-submit").click();
    await page.waitForURL(/\/plans\/(?!new)[^/]+$/);
    await expect(page.getByTestId("plan-title")).toHaveText(name);

    await page.goto("/plans");
    await expect(page.getByTestId("my-plans").getByText(name)).toBeVisible();
  });

  test("3. /recipes → search Jungle → detail → Add All → localStorage has ingredients", async ({ page }) => {
    await page.goto("/recipes");
    await page.getByLabel("Search recipes").fill("Jungle");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=Jungle/);

    const cards = page.getByTestId("recipe-card");
    await expect(cards).toHaveCount(1);
    await cards.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jungle Juice");

    // In dev mode the click can land before hydration; retry until the handler has run.
    // (addMany de-duplicates, so a repeated click is harmless.)
    await expect(async () => {
      await page.getByTestId("add-all-to-shopping-list").click();
      await expect(page.getByRole("status")).toContainText("Added to your basket", { timeout: 1_000 });
    }).toPass();

    const stored = await page.evaluate(() => window.localStorage.getItem("titan-raw-shopping-list"));
    expect(stored).not.toBeNull();
    const items = JSON.parse(stored!) as { text: string; recipeTitle: string; done: boolean }[];
    expect(items.map((i) => i.text)).toEqual([
      "1 whole pineapple, peeled",
      "2 cups fresh spinach",
      "1 large cucumber",
      "1 bunch fresh mint",
      "1 lime, peeled",
      "1-inch piece fresh ginger",
    ]);
    expect(items.every((i) => i.recipeTitle === "Jungle Juice" && i.done === false)).toBe(true);

    // Adding again does not duplicate
    await page.getByTestId("add-all-to-shopping-list").click();
    const again = await page.evaluate(() => JSON.parse(window.localStorage.getItem("titan-raw-shopping-list")!).length);
    expect(again).toBe(6);
  });

  test("start a template plan → /daily shows the plan's recipes for day 1", async ({ page }) => {
    await login(page, uniqueEmail("start"), "/plans");
    await page.getByTestId("plan-card").filter({ hasText: "3-Day Fresh Reset" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("start-plan").click();
    await page.waitForURL(/\/daily$/);
    await expect(page.getByText("Day 1 of 3")).toBeVisible();
    await expect(page.getByTestId("slot-row-BREAKFAST")).toContainText("Anti-Aging Superfood Smoothie");
    await expect(page.getByTestId("slot-row-DESSERT")).toContainText("Chocolate Pecan Pie");

    const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/daily"));
    await page.getByTestId("add-water").click();
    await saved;
    await expect(page.getByTestId("water-oz")).toHaveText(/8 oz/);
  });

  test("protected routes redirect to /login", async ({ page }) => {
    await page.goto("/daily");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});
