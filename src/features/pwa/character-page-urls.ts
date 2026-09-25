/**
 * URL des pages rendues à la demande pour chaque personnage, envoyées au service worker pour
 * qu'il les mette en cache à l'avance (voir `public/sw.js` et docs/adr/0045).
 */
export function characterPageUrls(characterIds: readonly string[]): string[] {
  return [...new Set(characterIds)].flatMap((id) => {
    const base = `/characters/${encodeURIComponent(id)}`;
    return [base, `${base}/edit`];
  });
}
