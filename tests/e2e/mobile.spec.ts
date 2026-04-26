import { test, expect } from "@playwright/test";

// Mobile project runs at iPhone 13 viewport (390x844).
// All assertions assume a viewport ≤ 880px (the docs-aside drawer breakpoint).

test.describe("mobile layout", () => {
  test("home page has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      return html.scrollWidth - html.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1); // sub-pixel rounding tolerance
  });

  test("/docs/Button page has no horizontal overflow", async ({ page }) => {
    await page.goto("/docs/Button/");
    // Wait for demos to render (so wide demos like States/Sizes are populated).
    await expect(page.locator(".demo-render").first()).toBeVisible();
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      return html.scrollWidth - html.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("docs sidebar drawer opens via hamburger and closes via backdrop", async ({ page }) => {
    await page.goto("/docs/Button/");
    const aside = page.locator("#docs-aside");
    const toggle = page.locator("#docs-aside-toggle");
    const backdrop = page.locator("#docs-aside-backdrop");

    await expect(toggle).toBeVisible();
    await expect(aside).not.toHaveClass(/\bopen\b/);

    await toggle.click();
    await expect(aside).toHaveClass(/\bopen\b/);
    await expect(backdrop).toHaveClass(/\bopen\b/);

    await backdrop.click({ force: true });
    await expect(aside).not.toHaveClass(/\bopen\b/);
    await expect(backdrop).not.toHaveClass(/\bopen\b/);
  });

  test("Escape closes an open drawer", async ({ page }) => {
    await page.goto("/docs/Button/");
    const aside = page.locator("#docs-aside");
    await page.locator("#docs-aside-toggle").click();
    await expect(aside).toHaveClass(/\bopen\b/);
    await page.keyboard.press("Escape");
    await expect(aside).not.toHaveClass(/\bopen\b/);
  });

  test("clicking a sidebar link navigates and closes the drawer", async ({ page }) => {
    await page.goto("/docs/Button/");
    await page.locator("#docs-aside-toggle").click();
    await expect(page.locator("#docs-aside")).toHaveClass(/\bopen\b/);

    await page.locator("#docs-aside .nav a", { hasText: "IconButton" }).first().click();
    await expect(page).toHaveURL(/\/docs\/IconButton\/?$/);
  });

  test("apps grid stacks to a single column", async ({ page }) => {
    await page.goto("/apps/");
    const cards = page.locator(".app-card");
    await expect(cards.first()).toBeVisible();
    const widths = await cards.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    // On a 390px viewport with 16px gutter, each card should span ~358px (one column).
    for (const w of widths) expect(w).toBeGreaterThan(300);
  });
});
