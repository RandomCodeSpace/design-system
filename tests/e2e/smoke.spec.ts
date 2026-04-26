import { test, expect } from "@playwright/test";

// Representative sample covering each category and each demo-generation
// heuristic (variants, sizes, states, open/close, theme, toast).
const SAMPLE_PAGES = [
  "Button",
  "IconButton",
  "Input",
  "Select",
  "Checkbox",
  "Switch",
  "Card",
  "Modal",
  "Drawer",
  "Tabs",
  "Menu",
  "Alert",
  "Badge",
  "Table",
  "Avatar",
  "ThemeProvider",
  "toast",
] as const;

test.describe("landing pages", () => {
  test("/ renders the hero and primary nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".site-brand-name")).toHaveText("RandomCodeSpace");
    await expect(page.locator("h1.page-h1")).toBeVisible();
    await expect(page.locator(".site-nav a", { hasText: "Components" })).toBeVisible();
    await expect(page.locator(".site-nav a", { hasText: "Playground" })).toBeVisible();
  });

  test("/docs/ lists every category and at least 40 component cards", async ({ page }) => {
    await page.goto("/docs/");
    await expect(page.locator(".section h2", { hasText: "Buttons & actions" })).toBeVisible();
    await expect(page.locator(".section h2", { hasText: "Forms & inputs" })).toBeVisible();
    await expect(page.locator(".section h2", { hasText: "Data display" })).toBeVisible();
    const cards = page.locator("a.card");
    await expect.poll(async () => await cards.count()).toBeGreaterThan(40);
  });

  test("/apps/ shows the three sample app cards", async ({ page }) => {
    await page.goto("/apps/");
    const apps = page.locator("a.app-card");
    await expect(apps).toHaveCount(3);
    await expect(apps.first().locator(".app-name")).toBeVisible();
  });
});

test.describe("component pages render their demos", () => {
  for (const name of SAMPLE_PAGES) {
    test(`/docs/${name}/ renders all demos without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      await page.goto(`/docs/${name}/`);

      // Ant-style demo cards must be present.
      const demos = page.locator("article.demo");
      await expect(demos.first()).toBeVisible();

      // Each demo's render area should contain something other than ".err".
      // The renderer creates a child div, so we wait until the render area
      // has at least one element child OR fails with .err (which we then
      // assert is absent).
      const count = await demos.count();
      for (let i = 0; i < count; i++) {
        const render = page.locator(`#demo-render-${i}`);
        await expect(render).toBeVisible();
        // Wait until the demo has rendered (any direct child).
        await expect.poll(async () => {
          return await render.locator(":scope > *").count();
        }, { timeout: 10_000 }).toBeGreaterThan(0);
        // No error overlay.
        await expect(render.locator(".err")).toHaveCount(0);
      }

      expect(errors, `unhandled errors on /docs/${name}/`).toEqual([]);
    });
  }
});

test.describe("playground", () => {
  test("renders the default Button example", async ({ page }) => {
    await page.goto("/docs/playground/");
    await expect(page.locator("textarea#code")).toBeVisible();
    const status = page.locator("#status");
    await expect.poll(async () => (await status.textContent())?.trim()).toBe("OK");
    // The preview pane should have rendered something (a child element).
    await expect.poll(async () => {
      return await page.locator("#preview > *").count();
    }, { timeout: 10_000 }).toBeGreaterThan(0);
  });
});
