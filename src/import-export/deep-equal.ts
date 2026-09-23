/** Égalité structurelle indépendante de l'ordre des clés — utilisée pour détecter les imports
 * strictement identiques aux données déjà stockées (statut "Identique" du preview d'import). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => deepEqual(item, b[index]))
    );
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);
    return (
      aKeys.length === bKeys.length &&
      aKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(bRecord, key) &&
          deepEqual(aRecord[key], bRecord[key]),
      )
    );
  }
  return false;
}
