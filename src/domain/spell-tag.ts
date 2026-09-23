/**
 * Association personnage ↔ sort : le domaine (ex : « Domaine de la Lune ») n'est pas une
 * propriété du sort lui-même (un sort peut être multi-classes, `Spell.classes`), mais dépend du
 * personnage qui le connaît. `alwaysPrepared` marque un sort disponible en jeu sans consommer de
 * préparation (ex : sorts de domaine toujours préparés pour un Clerc).
 */
export interface CharacterSpellTag {
  spellId: string;
  domain?: string;
  alwaysPrepared: boolean;
}
