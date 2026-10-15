import { expect, test } from "@playwright/test";
import { ROUTES } from "./routes";

// Propre au projet (e2e/a11y.spec.ts est le seed du kit) : ce que le layout promet à chaque page.

const APP_NAME = "Gestionnaire de personnage D&D";

test("every audited page title names the page and the app (RGAA 8.6)", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    const title = await page.title();
    expect(title, route).toMatch(new RegExp(`^\\S.* — ${APP_NAME}$`));
  }
});

test("the 404 title says the page was not found (RGAA 8.6)", async ({ page }) => {
  await page.goto("/__dnd-character-manager-not-found");
  await expect(page).toHaveTitle(`Page introuvable — ${APP_NAME}`);
  await expect(page.locator("main#contenu")).toHaveCount(1);
});

test("the first Tab shows the skip link, which leads to the main content (RGAA 12.7)", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  // Visible au focus avec sa marge intérieure, pas seulement la hauteur du texte (WCAG 2.5.8).
  const box = await skipLink.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#contenu$/);
  await expect(page.locator("main#contenu")).toHaveCount(1);
});
