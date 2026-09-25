import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import { findClassDefinition } from "../character-class";
import { findRaceDefinition } from "../race";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { abilityModifier } from "./modifiers";

/*
 * Valeurs de combat déduites de la classe, de la race, des caractéristiques et de l'équipement :
 * jamais stockées, seuls les bonus hors règles le sont — voir docs/adr/0026.
 */

/** Vitesse par défaut d'une race hors registre sans vitesse saisie (9 m = 30 pieds). */
export const DEFAULT_SPEED = 9;

/** Malus de vitesse d'une armure lourde portée sans la Force requise (règles 2014 : −3 m). */
export const HEAVY_ARMOR_SPEED_PENALTY = 3;

export interface StatPart {
  label: string;
  value: number;
}

export interface ComputedStat {
  total: number;
  breakdown: StatPart[];
}

/** Jets de sauvegarde maîtrisés : ceux de la classe, moins ceux que le joueur a retirés pour ce
 * personnage (docs/adr/0037), ∪ ceux ajoutés sur la fiche. */
export function effectiveSavingThrowProficiencies(character: Character): AbilityName[] {
  const removed = character.removedSavingThrowProficiencies ?? [];
  return [
    ...new Set([
      ...(findClassDefinition(character.classId)?.savingThrows ?? []).filter(
        (ability) => !removed.includes(ability),
      ),
      ...character.savingThrowProficiencies,
    ]),
  ];
}

/** Classe dont les règles prévoient la maîtrise de ce jet de sauvegarde, qu'elle soit conservée
 * ou retirée pour ce personnage. */
export function savingThrowGrantedBy(
  character: Character,
  ability: AbilityName,
): string | undefined {
  const definition = findClassDefinition(character.classId);
  return definition?.savingThrows.includes(ability) ? definition.name : undefined;
}

/** Initiative = modificateur de Dextérité + bonus hors règles éventuel. */
export function computeInitiative(character: Character): ComputedStat {
  const dexterity = effectiveAbilityScores(
    character.abilityScores,
    character.raceSelection,
  ).dexterity;
  const breakdown: StatPart[] = [{ label: "Dex", value: abilityModifier(dexterity) }];
  if (character.initiativeExtraBonus) {
    breakdown.push({ label: "Bonus", value: character.initiativeExtraBonus });
  }
  return { total: breakdown.reduce((sum, part) => sum + part.value, 0), breakdown };
}

/**
 * Vitesse de marche en mètres : celle de la race connue (sinon la vitesse de base saisie, sinon
 * 9 m), plus le bonus saisi (ex : Déplacement sans armure du Moine), moins 3 m en armure lourde
 * portée sans la Force requise (sauf race qui l'ignore, ex : Nain).
 */
export function computeSpeed(character: Character): ComputedStat {
  const race = character.raceSelection
    ? findRaceDefinition(character.raceSelection.raceId)
    : undefined;
  const breakdown: StatPart[] = [
    race
      ? { label: race.name, value: race.speed }
      : { label: "Base", value: character.baseSpeed ?? DEFAULT_SPEED },
  ];

  if (character.speedExtraBonus) {
    breakdown.push({ label: "Bonus", value: character.speedExtraBonus });
  }

  const strength = effectiveAbilityScores(
    character.abilityScores,
    character.raceSelection,
  ).strength;
  const tooHeavy =
    !race?.ignoresHeavyArmorSpeedPenalty &&
    character.inventory.some(
      (item) =>
        item.equipped &&
        item.armor?.category === "heavy" &&
        item.armor.strengthRequirement !== undefined &&
        strength < item.armor.strengthRequirement,
    );
  if (tooHeavy) {
    breakdown.push({
      label: "Armure lourde (Force insuffisante)",
      value: -HEAVY_ARMOR_SPEED_PENALTY,
    });
  }
  return { total: breakdown.reduce((sum, part) => sum + part.value, 0), breakdown };
}
