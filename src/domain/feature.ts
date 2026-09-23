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
}
