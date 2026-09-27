import type { AbilityScores } from "../ability-scores";
import type { Character } from "../character";
import type { BeastForm } from "../wild-shape";
import { effectiveAbilityScores } from "./effective-ability-scores";
import { clampCharacterLevel } from "./proficiency";

/*
 * Forme sauvage active et ses effets sur les valeurs calculées (règles 2014, docs/adr/0070). Ce
 * module ne dépend d'aucun autre calcul de combat : CA, vitesse, initiative et attaques s'y
 * appuient.
 */

/** Forme de bête dans laquelle le druide est transformé, `undefined` hors Forme sauvage. */
export function activeWildShapeForm(character: Character): BeastForm | undefined {
  const formId = character.wildShape?.formId;
  return formId === undefined
    ? undefined
    : character.wildShapeForms?.find((form) => form.id === formId);
}

/**
 * Caractéristiques utilisées en jeu : en Forme sauvage, Force, Dextérité et Constitution sont
 * celles de la bête ; Intelligence, Sagesse et Charisme restent celles du druide.
 */
export function playAbilityScores(character: Character): AbilityScores {
  const scores = effectiveAbilityScores(character.abilityScores, character.raceSelection);
  const form = activeWildShapeForm(character);
  return form
    ? {
        ...scores,
        strength: form.strength,
        dexterity: form.dexterity,
        constitution: form.constitution,
      }
    : scores;
}

/** « 1/4 » → 0,25 ; `undefined` si illisible. */
export function parseChallengeRating(value: string): number | undefined {
  const trimmed = value.trim();
  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(trimmed);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator > 0 ? Number(fraction[1]) / denominator : undefined;
  }
  const number = Number(trimmed.replace(",", "."));
  return trimmed !== "" && Number.isFinite(number) && number >= 0 ? number : undefined;
}

export interface WildShapeLimits {
  maxChallengeRating: number;
  /** Libellé du FP maximal, ex : « 1/4 ». */
  maxLabel: string;
  noFly: boolean;
  noSwim: boolean;
}

/** Limites du Druide (2014) : FP 1/4 sans vol ni nage au niveau 2, FP 1/2 sans vol au 4, FP 1 au 8.
 * Le Cercle de la lune, absent du registre, n'est pas modélisé. */
export function wildShapeLimits(level: number): WildShapeLimits {
  const clamped = clampCharacterLevel(level);
  if (clamped >= 8) return { maxChallengeRating: 1, maxLabel: "1", noFly: false, noSwim: false };
  if (clamped >= 4) return { maxChallengeRating: 0.5, maxLabel: "1/2", noFly: true, noSwim: false };
  return { maxChallengeRating: 0.25, maxLabel: "1/4", noFly: true, noSwim: true };
}

/** Ce que les règles interdisent pour cette forme au niveau du druide. Ce sont des avertissements,
 * pas un blocage : le MJ peut l'autoriser. */
export function wildShapeFormWarnings(character: Character, form: BeastForm): string[] {
  const limits = wildShapeLimits(character.level);
  const challenge = parseChallengeRating(form.challengeRating);
  return [
    ...(challenge !== undefined && challenge > limits.maxChallengeRating
      ? [`FP ${form.challengeRating} : au-delà du FP ${limits.maxLabel} permis à ce niveau.`]
      : []),
    ...(limits.noFly && (form.flySpeed ?? 0) > 0
      ? ["Vol : pas de forme volante avant le niveau 8."]
      : []),
    ...(limits.noSwim && (form.swimSpeed ?? 0) > 0
      ? ["Nage : pas de forme nageuse avant le niveau 4."]
      : []),
  ];
}

/** Durée maximale : la moitié du niveau de druide, en heures. */
export function wildShapeDurationHours(level: number): number {
  return Math.floor(clampCharacterLevel(level) / 2);
}
