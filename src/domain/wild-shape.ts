import type { DamageType } from "./inventory";

/**
 * Forme sauvage du Druide (règles 2014, docs/adr/0070) : les bêtes habituelles du druide sont
 * enregistrées sur sa fiche (aucun bestiaire officiel n'est fourni, pour les droits), et la forme
 * active remplace ses caractéristiques physiques, sa CA, sa vitesse, ses PV et ses attaques.
 */
export interface BeastAttack {
  id: string;
  name: string;
  /** Bonus au toucher du profil de la bête (ex : +4 pour la morsure du loup). */
  attackBonus: number;
  /** Dés de dégâts « NdM » (ex : « 2d4 »). */
  damageDice: string;
  /** Modificateur ajouté aux dés (ex : +2). */
  damageBonus: number;
  damageType: DamageType;
  /** Effet en plus (ex : « JS For DD 11 ou à terre »). */
  notes?: string;
}

export interface BeastForm {
  id: string;
  name: string;
  /** Facteur de puissance, tel qu'écrit dans le profil : « 0 », « 1/8 », « 1/4 », « 1/2 », « 1 »… */
  challengeRating: string;
  strength: number;
  dexterity: number;
  constitution: number;
  armorClass: number;
  maxHitPoints: number;
  /** Vitesses en mètres ; seules les vitesses de nage, vol et escalade sont facultatives. */
  speed: number;
  swimSpeed?: number;
  flySpeed?: number;
  climbSpeed?: number;
  attacks: BeastAttack[];
  /** Sens, traits (Odorat aiguisé, Tactique de groupe…), compétences de la bête. */
  notes?: string;
}

/** Forme sauvage en cours : la forme choisie et ses PV actuels (les PV du druide sont à part). */
export interface ActiveWildShape {
  formId: string;
  hitPoints: number;
}
