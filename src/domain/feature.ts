import type { ClassResourceId } from "./character-class";

export type FeatureRecharge = "shortRest" | "longRest" | "other";

/**
 * Trait/capacité générique — couvre aussi bien le Channel Divinity d'un Clerc que les features de
 * domaine/sous-classe, sans modéliser chaque source de règle séparément.
 */
export interface CharacterFeature {
  id: string;
  name: string;
  source: string;
  description: string;
  usesMax?: number;
  usesCurrent?: number;
  recharge?: FeatureRecharge;
  /** Ressource de classe consommée à chaque utilisation (ex : les options de Canalisation
   * divine). Une capacité liée n'a pas de compteur propre (`usesMax`/`usesCurrent`) : elle puise
   * dans la réserve commune calculée — voir src/domain/calculations/class-resources.ts. */
  resourceId?: ClassResourceId;
}
