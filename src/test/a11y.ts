import axe from "axe-core";

// WCAG 2.0 → 2.2, levels A and AA. RGAA 4.1.2 is built on WCAG 2.1 AA.
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export type A11yViolation = {
  rule: string;
  impact: string | null | undefined;
  help: string;
  targets: string[];
};

/**
 * Runs axe-core on a rendered container and returns WCAG violations in a readable shape
 * (`expect(await a11yViolations(container)).toEqual([])` prints what failed and where).
 * jsdom has no layout engine, so rules that need real rendering (contrast, target size) are left
 * to the Playwright specs in e2e/.
 */
export async function a11yViolations(container: Element): Promise<A11yViolation[]> {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: WCAG_TAGS },
    rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
  });
  return results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
}
