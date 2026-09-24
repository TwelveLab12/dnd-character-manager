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
 * sous-classe, moins celles que le joueur a retirées pour ce personnage (docs/adr/0035). */
export function effectiveArmorProficiencies(character: Character): ArmorCategory[] {
  return [
    ...new Set([
      ...(character.armorProficiencies ?? []),
      ...grantedProficiencies(character).flatMap((grant) => grant.armor),
    ]),
  ];
}

/** Maîtrises d'armes effectives, même logique que effectiveArmorProficiencies. */
export function effectiveWeaponProficiencies(character: Character): WeaponCategory[] {
  return [
    ...new Set([
      ...(character.weaponProficiencies ?? []),
      ...grantedProficiencies(character).flatMap((grant) => grant.weapons),
    ]),
  ];
}

export interface ProficiencyGrant {
  source: string;
  armor: readonly ArmorCategory[];
  weapons: readonly WeaponCategory[];
}

/** Maîtrises prévues par les règles (classe, sous-classe) avec leur source, y compris celles que
 * le joueur a retirées : pour la configuration, qui affiche la source d'une maîtrise retirée. */
export function ruleProficiencyGrants(character: Character): ProficiencyGrant[] {
  const classDefinition = findClassDefinition(character.classId);
  const subclass = subclassOf(character);
  return [
    ...(classDefinition?.proficiencies
      ? [{ source: classDefinition.name, ...classDefinition.proficiencies }]
      : []),
    ...(subclass ? [{ source: subclass.name, ...subclass.proficiencies }] : []),
  ];
}

/** Maîtrises accordées par les règles et conservées pour ce personnage (sans celles cochées sur
 * la fiche ni celles retirées), avec leur source, pour les calculs et l'onglet Notes. */
export function grantedProficiencies(character: Character): ProficiencyGrant[] {
  const removedArmor = character.removedArmorProficiencies ?? [];
  const removedWeapons = character.removedWeaponProficiencies ?? [];
  return ruleProficiencyGrants(character).map((grant) => ({
    source: grant.source,
    armor: grant.armor.filter((category) => !removedArmor.includes(category)),
    weapons: grant.weapons.filter((category) => !removedWeapons.includes(category)),
  }));
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

/**
 * Coche ou décoche une maîtrise (armure ou arme) pour ce personnage (docs/adr/0035). Pour une
 * maîtrise prévue par les règles, décocher l'inscrit dans les maîtrises retirées et recocher l'en
 * sort ; sinon, elle s'ajoute ou se retire des maîtrises cochées à la main. `order` garde un ordre
 * stable d'une modification à l'autre.
 */
export function toggleProficiency<T extends string>(
  order: readonly T[],
  state: { manual: readonly T[]; removed: readonly T[]; granted: boolean },
  category: T,
  checked: boolean,
): { manual: T[] | undefined; removed: T[] | undefined } {
  const manual = order.filter((item) =>
    item === category ? checked && !state.granted : state.manual.includes(item),
  );
  const removed = order.filter((item) =>
    item === category ? !checked && state.granted : state.removed.includes(item),
  );
  return {
    manual: manual.length > 0 ? manual : undefined,
    removed: removed.length > 0 ? removed : undefined,
  };
}
