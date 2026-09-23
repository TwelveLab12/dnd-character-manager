/** Identifiant lisible dérivé d'un nom (ex : "Fire Bolt" -> "fire-bolt"), utilisé comme id de
 * sort par défaut quand le JSON importé n'en fournit pas. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
