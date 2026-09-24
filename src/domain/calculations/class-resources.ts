import type { Character, ClassResourcesUsed } from "../character";
import type { ClassResourceDefinition, ClassResourceId } from "../character-class";
import { findClassDefinition } from "../character-class";
import { clampCharacterLevel } from "./proficiency";

export interface ClassResourceState {
  id: ClassResourceId;
  name: string;
  recharge: ClassResourceDefinition["recharge"];
  /** Calculé depuis la classe et le niveau, jamais stocké. */
  max: number;
  used: number;
  remaining: number;
}

/**
 * Ressources de classe du personnage (ex : Canalisation divine) : maximum calculé depuis le niveau,
 * utilisations lues dans l'état stocké et bornées au maximum. Les ressources à 0 au niveau actuel
 * (ex : Canalisation divine avant le niveau 2) sont omises.
 */
export function computeClassResources(character: Character): ClassResourceState[] {
  const definition = findClassDefinition(character.classId);
  if (!definition) {
    return [];
  }
  const level = clampCharacterLevel(character.level);
  return definition.resources
    .map((resource) => {
      const max = resource.usesAtLevel(level);
      const used = Math.min(max, Math.max(0, character.classResourcesUsed[resource.id] ?? 0));
      return {
        id: resource.id,
        name: resource.name,
        recharge: resource.recharge,
        max,
        used,
        remaining: max - used,
      };
    })
    .filter((resource) => resource.max > 0);
}

/** Ajuste les utilisations dépensées d'une ressource, borné à [0, max calculé]. */
export function adjustClassResourceUsed(
  character: Character,
  resourceId: ClassResourceId,
  delta: number,
): ClassResourcesUsed {
  const resource = computeClassResources(character).find(
    (candidate) => candidate.id === resourceId,
  );
  if (!resource) {
    return character.classResourcesUsed;
  }
  return {
    ...character.classResourcesUsed,
    [resourceId]: Math.min(resource.max, Math.max(0, resource.used + delta)),
  };
}

/** Utilisations remises à zéro pour les ressources récupérées par ce type de repos. */
export function restoreClassResources(
  character: Character,
  rest: "shortRest" | "longRest",
): ClassResourcesUsed {
  const definition = findClassDefinition(character.classId);
  const next: ClassResourcesUsed = { ...character.classResourcesUsed };
  for (const resource of definition?.resources ?? []) {
    // Un repos long restaure aussi tout ce qui se récupère au repos court.
    if (rest === "longRest" || resource.recharge === "shortRest") {
      delete next[resource.id];
    }
  }
  return next;
}
