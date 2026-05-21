import { test, expect } from "@playwright/test";

/**
 * Phase 1 happy-path: signup → onboarding (3 steps) → dashboard, in under 60s.
 *
 * Notes:
 *   - Uses a unique email per run so it doesn't collide with previous test users.
 *   - Doesn't clean up created users — that's fine for a local DB. For CI
 *     against shared DBs, add an afterAll() that deletes by email prefix.
 *   - Mobile-first viewport via the Pixel 7 device profile in playwright.config.ts.
 */
test("signup → onboarding → dashboard completes in under 60s", async ({ page }) => {
  test.setTimeout(60_000);
  const start = Date.now();

  const ts = Date.now();
  const email = `e2e+${ts}@momdaily.test`;
  const password = "test-password-123";
  const childBirthdate = (() => {
    // ~9 months old
    const d = new Date();
    d.setMonth(d.getMonth() - 9);
    return d.toISOString().slice(0, 10);
  })();

  // Landing → Sign up
  await page.goto("/");
  await page.getByRole("link", { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/signup$/);

  // Signup form
  await page.getByLabel(/your name/i).fill("Test Mom");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  // After auto-login we land on onboarding.
  await expect(page).toHaveURL(/\/onboarding$/);

  // Step 1: name (pre-filled, just continue)
  await expect(page.getByRole("heading", { name: /about you/i })).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 2: child
  await expect(page.getByRole("heading", { name: /your little one/i })).toBeVisible();
  await page.getByLabel(/child.*name/i).fill("Maya");
  await page.getByLabel(/birthdate/i).fill(childBirthdate);
  await page.getByRole("button", { name: /starting solids/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 3: top goal
  await expect(page.getByRole("heading", { name: /matters most/i })).toBeVisible();
  await page.getByRole("button", { name: /feeding confidence/i }).click();
  await page.getByRole("button", { name: /finish setup/i }).click();

  // Dashboard
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /test mom/i })).toBeVisible();

  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(60_000);
});

test("signup with duplicate email shows clear error", async ({ page }) => {
  const ts = Date.now();
  const email = `dup+${ts}@momdaily.test`;
  const password = "test-password-123";

  // First signup succeeds.
  await page.goto("/signup");
  await page.getByLabel(/your name/i).fill("Dup Mom");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // Sign out by clearing cookies, then try again with the same email.
  await page.context().clearCookies();
  await page.goto("/signup");
  await page.getByLabel(/your name/i).fill("Dup Mom");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page.getByText(/already exists/i)).toBeVisible();
});
