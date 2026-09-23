/** Identifiant opaque pour les entités créées côté client (personnages, sorts importés manuellement...). */
export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Filet de sécurité pour un environnement sans crypto.randomUUID (anciens navigateurs/tests).
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
