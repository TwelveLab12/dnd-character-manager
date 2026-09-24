import type { Character } from "../character";
import type { ClassResourceId } from "../character-class";
import { findClassDefinition, findSubclassDefinition, normalizeLabel } from "../character-class";
import type { ArmorCategory, WeaponCategory } from "../inventory";
import type { Spell } from "../spell";
import type { SpellReference } from "../subclass";
import { clampCharacterLevel } from "./proficiency";

/*
 * Ce que la classe et la sous-classe (domaine…) accordent d'office selon le niveau : sorts
 * toujours préparés, maîtrises, options de ressources de classe. Rien de tout cela n'est stocké
 * sur le personnage — voir docs/adr/0022 et 0025.
 */

function subclassOf(character: Character) {
  return findSubclassDefinition(character.classId, character.subclassId);
}

export function matchesSpellReference(spell: Spell, reference: SpellReference): boolean {
  const name = normalizeLabel(spell.name);
  return reference.aliases.some((alias) => name.includes(normalizeLabel(alias)));
}

export interface AlwaysPreparedSpell {
  reference: SpellReference;
  /** Sort correspondant dans la bibliothèque, absent si l'utilisateur ne l'a pas importé. */
  spell?: Spell;
}

/** Sorts de sous-classe toujours préparés au niveau actuel, rapprochés de la bibliothèque. */
export function computeAlwaysPreparedSpells(
  character: Character,
  library: readonly Spell[],
): AlwaysPreparedSpell[] {
  const subclass = subclassOf(character);
  if (!subclass) {
    return [];
  }
  const level = clampCharacterLevel(character.level);
  return subclass.alwaysPreparedSpells
    .filter((group) => group.minLevel <= level)
    .flatMap((group) => group.spells)
    .map((reference) => ({
      reference,
      spell: library.find((spell) => matchesSpellReference(spell, reference)),
    }));
}

/** Maîtrises d'armures effectives : celles cochées sur la fiche ∪ celles de la classe et de la
 * sous-classe. */
export function effectiveArmorProficiencies(character: Character): ArmorCategory[] {
  return [
    ...new Set([
      ...(character.armorProficiencies ?? []),
      ...(findClassDefinition(character.classId)?.proficiencies?.armor ?? []),
      ...(subclassOf(character)?.proficiencies.armor ?? []),
    ]),
  ];
}

/** Maîtrises d'armes effectives, même logique que effectiveArmorProficiencies. */
export function effectiveWeaponProficiencies(character: Character): WeaponCategory[] {
  return [
    ...new Set([
      ...(character.weaponProficiencies ?? []),
      ...(findClassDefinition(character.classId)?.proficiencies?.weapons ?? []),
      ...(subclassOf(character)?.proficiencies.weapons ?? []),
    ]),
  ];
}

/** Maîtrises accordées par les règles seules (sans celles cochées sur la fiche), avec leur
 * source, pour l'affichage en configuration et dans l'onglet Notes. */
export function grantedProficiencies(character: Character): {
  source: string;
  armor: readonly ArmorCategory[];
  weapons: readonly WeaponCategory[];
}[] {
  const classDefinition = findClassDefinition(character.classId);
  const subclass = subclassOf(character);
  return [
    ...(classDefinition?.proficiencies
      ? [{ source: classDefinition.name, ...classDefinition.proficiencies }]
      : []),
    ...(subclass ? [{ source: subclass.name, ...subclass.proficiencies }] : []),
  ];
}

export interface ClassResourceOption {
  id: string;
  name: string;
  /** Classe ou sous-classe qui accorde l'option. */
  source: string;
}

/** Options de la ressource accordées par les règles au niveau actuel (ex : Renvoi des
 * morts-vivants et Sanctuaire du Crépuscule pour la Canalisation divine d'un Clerc niv. 2+). */
export function computeClassResourceOptions(
  character: Character,
  resourceId: ClassResourceId,
): ClassResourceOption[] {
  const level = clampCharacterLevel(character.level);
  const classDefinition = findClassDefinition(character.classId);
  const subclass = subclassOf(character);
  const fromClass = (classDefinition?.resourceOptions ?? []).map((option) => ({
    option,
    source: classDefinition?.name ?? "",
  }));
  const fromSubclass = (subclass?.resourceOptions ?? []).map((option) => ({
    option,
    source: subclass?.name ?? "",
  }));
  return [...fromClass, ...fromSubclass]
    .filter(({ option }) => option.resourceId === resourceId && option.minLevel <= level)
    .map(({ option, source }) => ({ id: option.id, name: option.name, source }));
}
