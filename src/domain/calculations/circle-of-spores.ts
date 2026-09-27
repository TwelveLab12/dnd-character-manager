import type { Character } from "../character";
import { adjustClassResourceUsed, computeClassResources } from "./class-resources";
import { clampCharacterLevel } from "./proficiency";
import { resolveSpellcasting } from "./spellcasting";

/*
 * Cercle des spores (Chaudron de Tasha, docs/adr/0069) :
 * - Halo de spores (niveau 2) : en réaction, une créature qui entre ou commence son tour à 3 m ou
 *   moins fait un jet de sauvegarde de Constitution contre le DD des sorts, ou subit le dé du halo
 *   en dégâts nécrotiques ;
 * - Entité symbiotique (niveau 2) : une action et une utilisation de Forme sauvage, sans se
 *   transformer. 4 PV temporaires par niveau de druide, dé du halo lancé deux fois, +1d6 dégâts
 *   nécrotiques aux attaques d'arme au corps à corps. Dure 10 minutes, jusqu'à la perte de tous ces
 *   PV temporaires ou jusqu'à la Forme sauvage suivante.
 */

export const SYMBIOTIC_ENTITY_OPTION_ID = "symbiotic-entity";
export const SYMBIOTIC_ENTITY_DAMAGE_DICE = "1d6";

/** Druide du Cercle des spores de niveau 2 ou plus. */
export function hasCircleOfSporesFeatures(character: Character): boolean {
  return (
    character.classId === "druide" &&
    character.subclassId === "spores" &&
    clampCharacterLevel(character.level) >= 2
  );
}

/** Dé du Halo de spores : d4, d6 au niveau 6, d8 au 10, d10 au 14. */
export function haloOfSporesDie(level: number): string {
  const clamped = clampCharacterLevel(level);
  if (clamped >= 14) return "1d10";
  if (clamped >= 10) return "1d8";
  if (clamped >= 6) return "1d6";
  return "1d4";
}

export interface HaloOfSpores {
  /** Dés lancés : ceux du halo, deux fois sous Entité symbiotique (« 2d4 »). */
  dice: string;
  /** DD du jet de sauvegarde de Constitution : celui des sorts. */
  saveDC: number | undefined;
  doubled: boolean;
}

export function haloOfSpores(character: Character): HaloOfSpores {
  const die = haloOfSporesDie(character.level);
  const doubled = isSymbioticEntityActive(character);
  return {
    dice: doubled ? die.replace(/^1d/, "2d") : die,
    saveDC: resolveSpellcasting(character)?.spellSaveDC,
    doubled,
  };
}

export function symbioticEntityTemporaryHitPoints(character: Character): number {
  return 4 * clampCharacterLevel(character.level);
}

export function isSymbioticEntityActive(character: Character): boolean {
  return character.symbioticEntity === true && hasCircleOfSporesFeatures(character);
}

/** Raison pour laquelle l'Entité symbiotique ne peut pas être activée, ou `undefined`. */
export function symbioticEntityUnavailableReason(character: Character): string | undefined {
  if (!hasCircleOfSporesFeatures(character)) {
    return "Réservée aux druides du Cercle des spores, dès le niveau 2.";
  }
  const wildShape = computeClassResources(character).find(
    (resource) => resource.id === "wild-shape",
  );
  if (!wildShape || wildShape.remaining <= 0) {
    return "Plus de Forme sauvage avant le prochain repos.";
  }
  return undefined;
}

/**
 * Active l'Entité symbiotique : une Forme sauvage dépensée et les PV temporaires accordés. Les PV
 * temporaires ne se cumulent pas : on garde les plus élevés.
 */
export function startSymbioticEntity(character: Character): Partial<Character> {
  if (symbioticEntityUnavailableReason(character) !== undefined) {
    return {};
  }
  return {
    symbioticEntity: true,
    classResourcesUsed: adjustClassResourceUsed(character, "wild-shape", 1),
    hitPoints: {
      ...character.hitPoints,
      temporary: Math.max(
        character.hitPoints.temporary,
        symbioticEntityTemporaryHitPoints(character),
      ),
    },
  };
}

export function endSymbioticEntity(): Partial<Character> {
  return { symbioticEntity: undefined };
}

/** Tous les PV temporaires perdus : l'Entité symbiotique prend fin. */
export function reconcileSymbioticEntity(
  current: Character,
  patch: Partial<Character>,
): Partial<Character> {
  const next = { ...current, ...patch };
  return next.symbioticEntity && next.hitPoints.temporary <= 0
    ? { ...patch, symbioticEntity: undefined }
    : patch;
}
