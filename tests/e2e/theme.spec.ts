import { test, expect } from "@playwright/test";

test.describe("theme toggle", () => {
  test("toggles data-theme and persists to localStorage", async ({ page }) => {
    await page.goto("/");
    // Establish a known starting state.
    await page.evaluate(() => localStorage.removeItem("rcs-theme"));
    await page.reload();

    const html = page.locator("html");
    const before = await html.getAttribute("data-theme");
    expect(["light", "dark"]).toContain(before);

    await page.locator("#site-theme-toggle").click();

    // Atomic read: avoids any race between attribute mutation and ls write.
    const after = await page.evaluate(() => ({
      attr: document.documentElement.getAttribute("data-theme"),
      ls: localStorage.getItem("rcs-theme"),
    }));
    expect(after.attr).not.toBe(before);
    expect(after.ls).toBe(after.attr);

    // Survives reload: THEME_INIT_SCRIPT reads ls and re-applies the attribute.
    await page.reload();
    expect(await html.getAttribute("data-theme")).toBe(after.attr);
  });
});
