import type { AbilityName } from "../ability-scores";
import type { Character } from "../character";
import { normalizeLabel } from "../character-class";
import type { InventoryItem } from "../inventory";
import type { Spell } from "../spell";
import type { SpellReference } from "../subclass";
import { matchesSpellReference } from "./class-features";
import { resolveSpellcasting } from "./spellcasting";

/*
 * Gourdin magique (règles 2014, docs/adr/0068) : tour de magie lancé sur un gourdin ou un bâton
 * tenu en main. Pendant 1 minute, la caractéristique d'incantation remplace la Force à l'attaque et
 * aux dégâts, le dé de dégâts devient un d8 et l'arme est magique. Le sort prend fin s'il est
 * relancé ou si l'arme est lâchée.
 */

export const SHILLELAGH_SPELL: SpellReference = {
  name: "Gourdin magique",
  aliases: ["gourdin magique", "shillelagh"],
};

export const SHILLELAGH_DAMAGE_DICE = "1d8";

/** Gourdin ou bâton, reconnu à son nom (les armes de l'inventaire sont saisies librement). */
const ELIGIBLE_WEAPON = /\b(gourdin|baton|club|quarterstaff)\b/;

export function isShillelaghSpell(spell: Spell): boolean {
  return matchesSpellReference(spell, SHILLELAGH_SPELL);
}

/** Arme sur laquelle le sort peut être lancé : gourdin ou bâton de corps à corps. */
export function isShillelaghWeapon(item: InventoryItem): boolean {
  return item.weapon?.range === "melee" && ELIGIBLE_WEAPON.test(normalizeLabel(item.name));
}

/** Le personnage connaît (ou a préparé) le sort, d'après la bibliothèque. */
export function knowsShillelagh(character: Character, library: readonly Spell[]): boolean {
  const ids = new Set([...character.knownSpellIds, ...character.preparedSpellIds]);
  return library.some((spell) => ids.has(spell.id) && isShillelaghSpell(spell));
}

/** Gourdins et bâtons tenus en main, main principale d'abord. */
export function shillelaghTargets(character: Character): InventoryItem[] {
  const inHand = character.inventory.filter(
    (item) => item.equipped === true && isShillelaghWeapon(item),
  );
  return [
    ...inHand.filter((item) => item.hand !== "off"),
    ...inHand.filter((item) => item.hand === "off"),
  ];
}

/** Arme sous Gourdin magique, tant qu'elle est encore tenue en main. */
export function shillelaghItemId(character: Character): string | undefined {
  const itemId = character.shillelagh?.itemId;
  return itemId !== undefined && shillelaghTargets(character).some((item) => item.id === itemId)
    ? itemId
    : undefined;
}

/** Caractéristique d'incantation utilisée à la place de la Force (Sagesse par défaut : druide). */
export function shillelaghAbility(character: Character): AbilityName {
  return resolveSpellcasting(character)?.ability ?? "wisdom";
}

/** Lance (ou relance) le sort sur une arme en main ; sans arme désignée, la première en main. */
export function startShillelagh(character: Character, itemId?: string): Partial<Character> {
  const targets = shillelaghTargets(character);
  const target = itemId ? targets.find((item) => item.id === itemId) : targets[0];
  return target ? { shillelagh: { itemId: target.id } } : {};
}

export function endShillelagh(): Partial<Character> {
  return { shillelagh: undefined };
}

/** L'arme n'est plus tenue en main (rangée, lâchée, supprimée) : le sort prend fin. */
export function reconcileShillelagh(
  current: Character,
  patch: Partial<Character>,
): Partial<Character> {
  const next = { ...current, ...patch };
  return next.shillelagh && shillelaghItemId(next) === undefined
    ? { ...patch, shillelagh: undefined }
    : patch;
}
