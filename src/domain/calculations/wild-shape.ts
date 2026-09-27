import type { Character, HitPoints } from "../character";
import { adjustClassResourceUsed, computeClassResources } from "./class-resources";
import { damageCharacter } from "./death-saves";
import { applyDamage } from "./hit-points";
import { computeMaxHitPoints } from "./max-hit-points";
import { activeWildShapeForm } from "./wild-shape-form";

/*
 * Se transformer, encaisser et reprendre sa forme (règles 2014, docs/adr/0070). En Forme sauvage,
 * les PV sont ceux de la bête : à 0, le druide reprend sa forme et le surplus de dégâts passe sur
 * ses propres PV. Les PV temporaires, eux, restent au druide et absorbent les dégâts d'abord.
 */

/** Raison pour laquelle le druide ne peut pas se transformer, ou `undefined`. */
export function wildShapeUnavailableReason(character: Character): string | undefined {
  const wildShape = computeClassResources(character).find(
    (resource) => resource.id === "wild-shape",
  );
  if (!wildShape) {
    return "Pas de Forme sauvage pour cette classe à ce niveau.";
  }
  return wildShape.remaining <= 0 ? "Plus de Forme sauvage avant le prochain repos." : undefined;
}

/**
 * Se transforme : une utilisation dépensée, PV de la bête au maximum. L'Entité symbiotique prend
 * fin (docs/adr/0069), et l'arme tenue se fond dans la forme (fin de Gourdin magique).
 */
export function startWildShape(character: Character, formId: string): Partial<Character> {
  const form = character.wildShapeForms?.find((candidate) => candidate.id === formId);
  if (!form || wildShapeUnavailableReason(character) !== undefined) {
    return {};
  }
  return {
    wildShape: { formId, hitPoints: form.maxHitPoints },
    classResourcesUsed: adjustClassResourceUsed(character, "wild-shape", 1),
    symbioticEntity: undefined,
    shillelagh: undefined,
  };
}

/** Reprend sa forme (action bonus) : les PV du druide sont ceux qu'il avait avant. */
export function endWildShape(): Partial<Character> {
  return { wildShape: undefined };
}

/** PV affichés en jeu : ceux de la bête en Forme sauvage, sinon ceux du druide. */
export function displayedHitPoints(character: Character): {
  current: number;
  max: number;
  temporary: number;
  formName?: string;
} {
  const form = activeWildShapeForm(character);
  if (form && character.wildShape) {
    return {
      current: character.wildShape.hitPoints,
      max: form.maxHitPoints,
      temporary: character.hitPoints.temporary,
      formName: form.name,
    };
  }
  return {
    current: character.hitPoints.current,
    max: computeMaxHitPoints(character).total,
    temporary: character.hitPoints.temporary,
  };
}

/**
 * Dégâts en jeu : en Forme sauvage, PV temporaires puis PV de la bête ; à 0, retour à la forme
 * normale et le surplus s'applique au druide (jets contre la mort compris).
 */
export function takeDamage(
  character: Character,
  amount: number,
  options: { critical?: boolean } = {},
): Partial<Character> {
  const form = activeWildShapeForm(character);
  if (!form || !character.wildShape) {
    return damageCharacter(character, amount, options);
  }
  const beast = applyDamage(
    { current: character.wildShape.hitPoints, temporary: character.hitPoints.temporary },
    amount,
  );
  const hitPoints: HitPoints = { ...character.hitPoints, temporary: beast.temporary };
  if (beast.current > 0) {
    return { hitPoints, wildShape: { ...character.wildShape, hitPoints: beast.current } };
  }
  const overflow =
    Math.max(0, amount) - character.hitPoints.temporary - character.wildShape.hitPoints;
  const reverted: Character = { ...character, hitPoints, wildShape: undefined };
  return {
    hitPoints,
    wildShape: undefined,
    ...(overflow > 0 ? damageCharacter(reverted, overflow, options) : {}),
  };
}

/** Soins en jeu : en Forme sauvage, ils vont aux PV de la bête, plafonnés à son maximum. */
export function healInPlay(character: Character, amount: number): Partial<Character> {
  const { current, max } = displayedHitPoints(character);
  return setHitPointsInPlay(character, current + Math.max(0, amount), max);
}

/** Correction directe des PV affichés (bornés à [0, max]). */
export function setHitPointsInPlay(
  character: Character,
  value: number,
  max = displayedHitPoints(character).max,
): Partial<Character> {
  const next = Math.max(0, Math.min(max, value));
  if (activeWildShapeForm(character) && character.wildShape) {
    // 0 PV de bête : le druide reprend sa forme, sans surplus.
    return next === 0
      ? { wildShape: undefined }
      : { wildShape: { ...character.wildShape, hitPoints: next } };
  }
  return { hitPoints: { ...character.hitPoints, current: next } };
}
