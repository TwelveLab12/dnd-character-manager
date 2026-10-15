// WCAG contrast of CSS colour tokens, without a browser. Supports oklch() (shadcn/Tailwind v4),
// #hex and rgb(). Colours with transparency return null: their contrast depends on what is behind.

type LinearRgb = [number, number, number];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

function oklchToLinear(l: number, c: number, h: number): LinearRgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    clamp(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    clamp(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ];
}

const linearize = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const isOpaque = (alpha: string | undefined) =>
  alpha === undefined || parseFloat(alpha) >= (alpha.endsWith("%") ? 100 : 1);

export function parseColor(value: string): LinearRgb | null {
  const v = value.trim().toLowerCase();

  const oklch =
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (oklch) {
    const [, l = "0", percent, c = "0", h = "0", alpha] = oklch;
    if (!isOpaque(alpha)) return null;
    return oklchToLinear(parseFloat(l) / (percent ? 100 : 1), parseFloat(c), parseFloat(h));
  }

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((ch) => ch + ch).join("") : hex;
    const channels = [0, 2, 4].map((i) => linearize(parseInt(full.slice(i, i + 2), 16) / 255));
    return channels as LinearRgb;
  }

  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    const [, r = "0", g = "0", b = "0", alpha] = rgb;
    if (!isOpaque(alpha)) return null;
    return [r, g, b].map((ch) => linearize(parseInt(ch, 10) / 255)) as LinearRgb;
  }

  return null;
}

const luminance = ([r, g, b]: LinearRgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function contrastRatio(a: LinearRgb, b: LinearRgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Custom properties declared in `:root`, `.dark` and Tailwind v4 `@theme` blocks, with `var(--x)`
 * resolved. `@theme` colours count as light-theme (`:root`) tokens; its pure aliases
 * (`--color-x: var(--x)`, shadcn's `@theme inline`) are skipped to avoid duplicate pairs.
 */
export function readThemes(css: string): Map<string, Map<string, string>> {
  const themes = new Map<string, Map<string, string>>();
  const blocks = /(?:^|\n)\s*(:root|\.dark|@theme(?:\s+inline)?)\s*\{([^}]*)\}/g;
  for (const block of css.matchAll(blocks)) {
    const [, rawSelector = "", body = ""] = block;
    const isTheme = rawSelector.startsWith("@theme");
    const selector = isTheme ? ":root" : rawSelector;
    const tokens = themes.get(selector) ?? new Map<string, string>();
    for (const decl of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name = "", value = ""] = decl;
      if (isTheme && /^var\(/.test(value.trim())) continue;
      tokens.set(name, value.trim());
    }
    themes.set(selector, tokens);
  }
  const root = themes.get(":root") ?? new Map<string, string>();
  const resolve = (tokens: Map<string, string>, name: string, depth = 0): string | undefined => {
    const value = tokens.get(name) ?? root.get(name);
    const ref = value && /^var\(--([\w-]+)\)$/.exec(value)?.[1];
    return ref && depth < 10 ? resolve(tokens, ref, depth + 1) : value;
  };
  for (const [selector, tokens] of themes) {
    const merged = new Map(root);
    for (const name of tokens.keys()) merged.set(name, tokens.get(name) ?? "");
    for (const name of merged.keys()) merged.set(name, resolve(tokens, name) ?? "");
    themes.set(selector, merged);
  }
  return themes;
}
