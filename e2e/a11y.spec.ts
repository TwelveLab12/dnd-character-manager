import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "./routes";

// WCAG 2.0 → 2.2, levels A and AA (RGAA 4.1.2 is built on WCAG 2.1 AA), plus axe's best
// practices (landmarks, heading order, page h1, skip link…), which map to RGAA 9 and 12.
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const MAX_TAB_STOPS = 50;
// Tagged so CI can run these specs in a separate, non-blocking job (kit var a11yGate=advisory).
const A11Y = { tag: "@a11y" };

async function wcagViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(" ")),
  }));
}

// Freeze transitions so focus styles are read in their final state.
async function open(page: Page, route: string) {
  await page.goto(route);
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });
}

for (const route of ROUTES) {
  test.describe(`a11y ${route}`, A11Y, () => {
    test("no WCAG 2.2 AA violation (axe)", async ({ page }) => {
      await open(page, route);
      expect(await wcagViolations(page)).toEqual([]);
    });

    test("reflows at 320 px without horizontal scroll (WCAG 1.4.10, RGAA 10.11)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await open(page, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(await wcagViolations(page)).toEqual([]);
    });

    test("has lang, a title and a coherent heading outline (RGAA 8.3, 8.5, 9.1)", async ({
      page,
    }) => {
      await open(page, route);
      await expect(page.locator("html")).toHaveAttribute("lang", /\S/);
      expect((await page.title()).trim()).not.toBe("");
      const levels = await page
        .locator("h1, h2, h3, h4, h5, h6")
        .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
      expect(
        levels.filter((level) => level === 1),
        "exactly one h1",
      ).toHaveLength(1);
      const skips = levels.filter((level, i) => i > 0 && level > (levels[i - 1] ?? 0) + 1);
      expect(skips, `heading levels skipped in ${levels.join(" > ")}`).toEqual([]);
    });

    test("every keyboard focus stop is visible (WCAG 2.4.7, RGAA 10.7)", async ({ page }) => {
      await open(page, route);
      const invisible: string[] = [];
      for (let i = 0; i < MAX_TAB_STOPS; i++) {
        await page.keyboard.press("Tab");
        // Compare the focused element's styles with its unfocused ones; refocusing keeps the
        // keyboard modality, so :focus-visible still applies.
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el.dataset.a11yVisited) return null;
          el.dataset.a11yVisited = "true";
          const read = () => {
            const s = getComputedStyle(el);
            // An outline with style "none" is invisible whatever its reported width/colour.
            const outline =
              s.outlineStyle === "none" || s.outlineWidth === "0px"
                ? "none"
                : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`;
            return [
              outline,
              s.boxShadow,
              s.borderColor,
              s.backgroundColor,
              s.color,
              s.textDecorationLine,
            ].join("|");
          };
          const focused = read();
          el.blur();
          const blurred = read();
          el.focus();
          const name =
            el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 40) || el.tagName;
          return { id: `${el.tagName}:${name}`, visible: focused !== blurred };
        });
        if (!stop) break; // focus left the page or came back to a visited element: all covered
        if (!stop.visible) invisible.push(stop.id);
      }
      expect(invisible, "focus stops without a visible indicator").toEqual([]);
    });
  });
}

test("page titles are unique (RGAA 8.6)", A11Y, async ({ page }) => {
  const titles: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route);
    titles.push(await page.title());
  }
  expect(new Set(titles).size, titles.join(" / ")).toBe(titles.length);
});

// The 404 is a page template too, and the one nobody looks at.
test("404 page has no WCAG 2.2 AA violation (axe)", A11Y, async ({ page }) => {
  const response = await page.goto("/__claude-kit-a11y-not-found");
  expect(response?.status()).toBe(404);
  expect(await wcagViolations(page)).toEqual([]);
});
