/**
 * Génère les icônes de l'application (d20 doré sur fond nuit, palette Séluné) à partir d'une
 * géométrie unique, pour que toutes les tailles restent cohérentes :
 *
 * - `src/app/icon.svg` — favicon vectoriel (convention de fichier Next) ;
 * - `src/app/favicon.ico` — repli 16/32 px pour les navigateurs qui demandent `/favicon.ico` ;
 * - `src/app/apple-icon.png` — icône d'écran d'accueil iOS (180 px, plein cadre : iOS arrondit) ;
 * - `public/icons/icon-{192,512}.png` — icônes `purpose: "any"` du manifest ;
 * - `public/icons/icon-maskable-512.png` — icône `purpose: "maskable"` (dé réduit pour tenir dans
 *   la zone sûre de 80 % qu'Android découpe en cercle/squircle).
 *
 * Utilitaire manuel (`pnpm generate:icons`), pas lancé en CI : les fichiers générés sont versionnés.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const NIGHT = "#0e1120";
const NIGHT_2 = "#161b2e";
const GOLD_LIGHT = "#f0d58f";
const GOLD = "#d6b25f";
const GOLD_DARK = "#a9843a";
const GOLD_DEEP = "#7d5f24";

type Point = readonly [number, number];

/** d20 vu de face : hexagone extérieur + face centrale, sur un viewBox 512×512. */
function d20(radius: number): string {
  const cx = 256;
  const cy = 256;
  const at = (deg: number, r: number): Point => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const top = at(-90, radius);
  const upperRight = at(-30, radius);
  const lowerRight = at(30, radius);
  const bottom = at(90, radius);
  const lowerLeft = at(150, radius);
  const upperLeft = at(210, radius);
  // Face centrale (triangle pointe en haut), légèrement remontée pour l'effet de perspective.
  const inner = radius * 0.56;
  const apex = at(-90, inner);
  const innerLeft = at(150, inner);
  const innerRight = at(30, inner);

  const face = (fill: string, ...points: Point[]) =>
    `<polygon points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}" fill="${fill}"/>`;

  const stroke = Math.max(4, radius * 0.035);
  return [
    `<g stroke="${NIGHT}" stroke-width="${stroke.toFixed(1)}" stroke-linejoin="round">`,
    // Faces hautes (éclairées), latérales (moyennes), basses (dans l'ombre).
    face(GOLD, top, upperRight, apex),
    face(GOLD, top, apex, upperLeft),
    face(GOLD_DARK, upperRight, innerRight, apex),
    face(GOLD_DARK, upperLeft, apex, innerLeft),
    face(GOLD_DARK, upperRight, lowerRight, innerRight),
    face(GOLD_DARK, upperLeft, innerLeft, lowerLeft),
    face(GOLD_DEEP, lowerRight, bottom, innerRight),
    face(GOLD_DEEP, lowerLeft, innerLeft, bottom),
    face(GOLD_DEEP, innerLeft, innerRight, bottom),
    face(GOLD_LIGHT, apex, innerRight, innerLeft),
    "</g>",
  ].join("");
}

function svg({ radius, rounded }: { radius: number; rounded: boolean }): string {
  const background = rounded
    ? `<rect width="512" height="512" rx="112" fill="url(#bg)"/>`
    : `<rect width="512" height="512" fill="url(#bg)"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">`,
    `<defs><radialGradient id="bg" cx="50%" cy="40%" r="70%">`,
    `<stop offset="0" stop-color="${NIGHT_2}"/><stop offset="1" stop-color="${NIGHT}"/>`,
    `</radialGradient></defs>`,
    background,
    d20(radius),
    `</svg>`,
  ].join("");
}

/** ICO minimal embarquant des PNG (format accepté par tous les navigateurs actuels). */
function ico(pngs: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
}

const png = (source: string, size: number) =>
  sharp(Buffer.from(source)).resize(size, size).png().toBuffer();

async function main() {
  const root = process.cwd();
  const standard = svg({ radius: 200, rounded: true });
  const fullBleed = svg({ radius: 200, rounded: false });
  const maskable = svg({ radius: 160, rounded: false });

  await mkdir(path.join(root, "public/icons"), { recursive: true });
  await writeFile(path.join(root, "src/app/icon.svg"), `${standard}\n`);
  await writeFile(path.join(root, "src/app/apple-icon.png"), await png(fullBleed, 180));
  await writeFile(path.join(root, "public/icons/icon-192.png"), await png(standard, 192));
  await writeFile(path.join(root, "public/icons/icon-512.png"), await png(standard, 512));
  await writeFile(path.join(root, "public/icons/icon-maskable-512.png"), await png(maskable, 512));
  await writeFile(
    path.join(root, "src/app/favicon.ico"),
    ico([
      { size: 16, data: await png(standard, 16) },
      { size: 32, data: await png(standard, 32) },
    ]),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
