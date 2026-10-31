import { expect, type Page } from "@playwright/test";

export function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@titan-raw.test`;
}

/** Signs in through the real /login page using the dev-login credentials provider. */
export async function login(page: Page, email: string, callbackUrl = "/") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}
