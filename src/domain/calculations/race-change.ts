import type { AbilityScores } from "../ability-scores";
import type { Character } from "../character";
import type { RaceDefinition } from "../race";
import { findRaceDefinition } from "../race";
import { effectiveAbilityScores } from "./effective-ability-scores";

type RaceFields = Pick<
  Character,
  "race" | "raceSelection" | "abilityScores" | "baseSpeed" | "speedExtraBonus"
>;

/** Retire les bonus fixes de la race : scores saisis « bonus inclus » → scores de base. */
function withoutFixedBonuses(scores: AbilityScores, race: RaceDefinition): AbilityScores {
  const result = { ...scores };
  for (const rule of race.abilityBonusRules) {
    if (rule.type === "fixed") {
      result[rule.ability] -= rule.amount;
    }
  }
  return result;
}

/**
 * Change la race d'un personnage (docs/adr/0051). Passer d'une race en texte libre à une race
 * connue, ou l'inverse, conserve les scores effectifs et la vitesse :
 * - texte libre → race connue : les scores saisis incluaient déjà les bonus, les bonus fixes de la
 *   race en sont retirés ; une vitesse saisie plus rapide que celle de la race devient un bonus de
 *   vitesse (ex : moine tieffelin 12 m → 9 m + 3 m) ;
 * - race connue → texte libre : les scores de base reçoivent les bonus de la race (y compris ceux
 *   au choix), et la vitesse de la race devient la vitesse saisie.
 * Entre deux races connues, seuls la race et ses choix changent (création de personnage).
 */
export function changeRace(character: RaceFields, raceId: string | undefined): Partial<Character> {
  const current = character.raceSelection
    ? findRaceDefinition(character.raceSelection.raceId)
    : undefined;
  const target = raceId ? findRaceDefinition(raceId) : undefined;

  if (!target) {
    if (!current) {
      return {};
    }
    return {
      raceSelection: undefined,
      abilityScores: effectiveAbilityScores(character.abilityScores, character.raceSelection),
      baseSpeed: current.speed,
    };
  }
  if (current?.id === target.id) {
    return {};
  }

  const selection = {
    raceSelection: { raceId: target.id, abilityBonusChoices: [] },
    race: target.name,
  };
  if (current) {
    return selection;
  }

  const extraSpeed =
    character.baseSpeed !== undefined && character.baseSpeed > target.speed
      ? character.baseSpeed - target.speed
      : 0;
  return {
    ...selection,
    abilityScores: withoutFixedBonuses(character.abilityScores, target),
    baseSpeed: undefined,
    ...(extraSpeed > 0 ? { speedExtraBonus: (character.speedExtraBonus ?? 0) + extraSpeed } : {}),
  };
}
