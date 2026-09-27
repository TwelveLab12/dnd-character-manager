import type { Character, DeathSaves } from "../character";
import { applyDamage } from "./hit-points";
import { computeMaxHitPoints } from "./max-hit-points";

/**
 * Jets de sauvegarde contre la mort (règles 2014, docs/adr/0060) :
 * - à 0 PV, le personnage est mourant et lance un d20 sans modificateur à chaque tour ;
 * - 10+ : réussite, moins : échec ; 1 naturel : deux échecs ; 20 naturel : 1 PV ;
 * - 3 réussites : stabilisé ; 3 échecs : mort ;
 * - un dégât subi à 0 PV : un échec (deux sur un critique) ; un dégât d'au moins les PV max : mort ;
 * - tout soin remet les compteurs à zéro.
 */
export const DEATH_SAVES_TO_RESOLVE = 3;

export type DyingStatus = "alive" | "dying" | "stable" | "dead";

export function deathSavesOf(character: Pick<Character, "deathSaves">): DeathSaves {
  return {
    successes: clampCount(character.deathSaves?.successes),
    failures: clampCount(character.deathSaves?.failures),
  };
}

function clampCount(value: number | undefined): number {
  return Math.min(DEATH_SAVES_TO_RESOLVE, Math.max(0, Math.trunc(value ?? 0)));
}

export function dyingStatus(character: Character): DyingStatus {
  if (character.hitPoints.current > 0) {
    return "alive";
  }
  if (deathSavesOf(character).failures >= DEATH_SAVES_TO_RESOLVE) {
    return "dead";
  }
  return character.stable === true ? "stable" : "dying";
}

/** Plus de jets contre la mort en cours ni d'état stabilisé. */
const CLEARED: Pick<Character, "deathSaves" | "stable"> = {
  deathSaves: undefined,
  stable: undefined,
};

/**
 * Fixe les compteurs (cases cochées à la main, résultat d'un vrai dé…). Trois réussites
 * stabilisent le personnage et remettent les compteurs à zéro.
 */
export function setDeathSaves(deathSaves: DeathSaves): Partial<Character> {
  const next = deathSavesOf({ deathSaves });
  if (next.successes >= DEATH_SAVES_TO_RESOLVE && next.failures < DEATH_SAVES_TO_RESOLVE) {
    return { ...CLEARED, stable: true };
  }
  return { deathSaves: next, stable: undefined };
}

export type DeathSaveOutcome = "success" | "failure" | "critical-failure" | "critical-success";

export function deathSaveOutcome(roll: number): DeathSaveOutcome {
  if (roll >= 20) {
    return "critical-success";
  }
  if (roll <= 1) {
    return "critical-failure";
  }
  return roll >= 10 ? "success" : "failure";
}

/** Applique un jet de sauvegarde contre la mort (d20 de 1 à 20) d'un personnage mourant. */
export function rollDeathSave(character: Character, roll: number): Partial<Character> {
  if (dyingStatus(character) !== "dying" || !Number.isInteger(roll) || roll < 1 || roll > 20) {
    return {};
  }
  const { successes, failures } = deathSavesOf(character);
  switch (deathSaveOutcome(roll)) {
    case "critical-success":
      return { ...CLEARED, hitPoints: { ...character.hitPoints, current: 1 } };
    case "success":
      return setDeathSaves({ successes: successes + 1, failures });
    case "failure":
      return setDeathSaves({ successes, failures: failures + 1 });
    case "critical-failure":
      return setDeathSaves({ successes, failures: failures + 2 });
  }
}

/** Stabilise un personnage mourant (Médecine DD 10, trousse de soins, Épargner les mourants). */
export function stabilize(character: Character): Partial<Character> {
  return dyingStatus(character) === "dying" ? { ...CLEARED, stable: true } : {};
}

/**
 * Dégâts appliqués au personnage : PV temporaires puis PV courants (voir applyDamage). À 0 PV,
 * un dégât qui passe les PV temporaires ajoute un échec — deux sur un critique — et fait perdre
 * l'état stabilisé ; s'il atteint les PV max, c'est la mort. Tomber à 0 PV démarre des jets
 * neufs.
 */
export function damageCharacter(
  character: Character,
  amount: number,
  { critical = false }: { critical?: boolean } = {},
): Partial<Character> {
  const hitPoints = applyDamage(character.hitPoints, amount);
  if (character.hitPoints.current > 0) {
    return { hitPoints, ...(hitPoints.current === 0 ? CLEARED : {}) };
  }
  const throughTemporary = Math.max(0, amount) - character.hitPoints.temporary;
  if (throughTemporary <= 0 || dyingStatus(character) === "dead") {
    return { hitPoints };
  }
  const { successes, failures } = deathSavesOf(character);
  const massive = throughTemporary >= computeMaxHitPoints(character).total;
  return {
    hitPoints,
    stable: undefined,
    deathSaves: {
      successes: character.stable ? 0 : successes,
      failures: massive
        ? DEATH_SAVES_TO_RESOLVE
        : Math.min(DEATH_SAVES_TO_RESOLVE, failures + (critical ? 2 : 1)),
    },
  };
}

/**
 * Accorde l'état de mort aux changements de PV : revenir au-dessus de 0 PV (soin, repos, dé de
 * vie…) ou y tomber remet les jets contre la mort à zéro. À appliquer à toute mise à jour des PV
 * qui ne passe pas par damageCharacter.
 */
export function reconcileDeathSaves(
  character: Character,
  patch: Partial<Character>,
): Partial<Character> {
  if (!patch.hitPoints || "deathSaves" in patch || "stable" in patch) {
    return patch;
  }
  const before = character.hitPoints.current;
  const after = patch.hitPoints.current;
  if (after > 0 || (before > 0 && after === 0)) {
    return character.deathSaves || character.stable ? { ...patch, ...CLEARED } : patch;
  }
  return patch;
}
