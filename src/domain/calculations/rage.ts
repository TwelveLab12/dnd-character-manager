import type { Character } from "../character";
import { normalizeLabel, rageDamageBonus } from "../character-class";
import { adjustClassResourceUsed, computeClassResources } from "./class-resources";
import { clampCharacterLevel } from "./proficiency";

/** Rage du Barbare (règles 2014, docs/adr/0055). */

export interface RageEffects {
  damageBonus: number;
  resistances: string;
}

/** Esprit totem de l'ours : lu dans le libellé de la Voie du guerrier totémique (« … (Ours) »),
 * seul endroit où la fiche note l'esprit choisi. */
function hasBearTotem(character: Character): boolean {
  return (
    character.subclassId === "guerrier-totemique" &&
    /\bours\b/.test(normalizeLabel(character.subclass ?? ""))
  );
}

export function rageEffects(character: Character): RageEffects {
  return {
    damageBonus: rageDamageBonus(clampCharacterLevel(character.level)),
    resistances: hasBearTotem(character)
      ? "tous les dégâts sauf psychiques (esprit de l’ours)"
      : "dégâts contondants, perforants et tranchants",
  };
}

/** Raison pour laquelle le personnage ne peut pas entrer en rage, ou `undefined` s'il le peut. */
export function rageUnavailableReason(character: Character): string | undefined {
  const rage = computeClassResources(character).find((resource) => resource.id === "rage");
  if (!rage) {
    return "Pas de rage pour cette classe.";
  }
  if (rage.remaining <= 0) {
    return "Plus de rage avant le prochain repos long.";
  }
  const heavyArmor = character.inventory.some(
    (item) => item.equipped === true && item.armor?.category === "heavy",
  );
  return heavyArmor ? "Impossible en armure lourde." : undefined;
}

/** Entrer en rage : dépense une rage et met fin à la concentration (pas de sorts en rage). */
export function startRage(character: Character): Partial<Character> {
  if (rageUnavailableReason(character) !== undefined) {
    return {};
  }
  return {
    raging: true,
    classResourcesUsed: adjustClassResourceUsed(character, "rage", 1),
    concentration: { active: false },
  };
}

export function endRage(): Partial<Character> {
  return { raging: undefined };
}
