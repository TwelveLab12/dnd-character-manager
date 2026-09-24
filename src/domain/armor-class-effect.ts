/**
 * Effet temporaire sur la CA (sort, capacité…). Deux déclencheurs :
 * - `concentration` : actif tant que le personnage se concentre sur ce sort précis
 *   (`Character.concentration.spellId`), ex : Bouclier de la foi +2 ;
 * - `manual` : activé/désactivé à la main en mode jeu, pour les effets sans concentration
 *   (ex : Bouclier +5 en réaction).
 */
export type ArmorClassEffectTrigger =
  { type: "concentration"; spellId: string } | { type: "manual"; active: boolean };

export interface ArmorClassEffect {
  id: string;
  name: string;
  bonus: number;
  trigger: ArmorClassEffectTrigger;
}
