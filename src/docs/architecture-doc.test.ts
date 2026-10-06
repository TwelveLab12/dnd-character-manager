import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docsDir = join(process.cwd(), "docs");
const architecture = readFileSync(join(docsDir, "architecture.md"), "utf8");
const adrFiles = readdirSync(join(docsDir, "adr"))
  .filter((file) => /^\d{4}-.+\.md$/.test(file))
  .sort();

const INDEX_HEADING = "## Index des ADR par thème";
const index = architecture.slice(architecture.indexOf(INDEX_HEADING));

function linkedAdrs(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(adr\/(\d{4}-[^)]+\.md)\)/g)].map((match) => match[1] ?? "");
}

/**
 * `docs/architecture.md` résume les ADR (docs/adr/0073). Ce test l'empêche de se périmer : un nouvel
 * ADR doit y être rangé dans la même PR, et aucun lien ne doit pointer dans le vide.
 */
describe("docs/architecture.md", () => {
  it("has an index section", () => {
    expect(architecture).toContain(INDEX_HEADING);
  });

  it("lists every ADR exactly once in its index", () => {
    const indexed = linkedAdrs(index);

    const missing = adrFiles.filter((file) => !indexed.includes(file));
    expect(
      missing,
      `ADR absents de l'index : rangez-les dans un thème de docs/architecture.md`,
    ).toEqual([]);

    const duplicated = indexed.filter((file, position) => indexed.indexOf(file) !== position);
    expect(duplicated, "ADR présents plusieurs fois dans l'index").toEqual([]);
  });

  it("only links to ADR files that exist", () => {
    const broken = linkedAdrs(architecture).filter(
      (file) => !existsSync(join(docsDir, "adr", file)),
    );
    expect(broken).toEqual([]);
  });
});
