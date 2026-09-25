import type { AbilityName } from "./ability-scores";

/**
 * Règle de bonus racial (règles 2014) : soit un bonus fixe sur une caractéristique donnée (ex :
 * Nain +2 Constitution), soit un choix de `count` caractéristiques distinctes parmi lesquelles
 * répartir `amount` chacune (ex : Humain variant : +1 à 2 caractéristiques au choix), avec une
 * liste optionnelle de caractéristiques exclues du choix (ex : Demi-Elfe : +2 Charisme fixe, puis
 * +1 à 2 AUTRES caractéristiques au choix — le Charisme ne peut pas être choisi une seconde fois).
 */
export type AbilityBonusRule =
  | { type: "fixed"; ability: AbilityName; amount: number }
  | { type: "choice"; amount: number; count: number; exclude?: AbilityName[] };

export interface RaceDefinition {
  id: string;
  name: string;
  abilityBonusRules: AbilityBonusRule[];
  /** Vitesse de marche de base, en mètres (9 m = 30 pieds). */
  speed: number;
}

/**
 * Choix du joueur pour une race donnée : quelles caractéristiques ont été sélectionnées pour
 * chaque règle de type "choice" de la race, dans l'ordre des règles (une race n'a généralement
 * qu'une seule règle "choice", mais le tableau à plat couvre aussi le cas de plusieurs règles).
 */
export interface RaceSelection {
  raceId: string;
  abilityBonusChoices: AbilityName[];
}

/**
 * Liste volontairement minimale au démarrage (juste de quoi couvrir un Humain variant) — conçue
 * pour être étendue par simple ajout d'entrées, pas par réécriture. Uniquement des noms/nombres
 * (mécanique de jeu), aucun texte de trait racial du SRD reproduit ici — voir
 * docs/adr/0009-generic-race-ability-bonuses.md et docs/adr/0004 sur la même logique déjà
 * appliquée à la table d'emplacements de sorts.
 */
export const RACE_DEFINITIONS: readonly RaceDefinition[] = [
  {
    id: "humain",
    name: "Humain",
    speed: 9,
    abilityBonusRules: [
      { type: "fixed", ability: "strength", amount: 1 },
      { type: "fixed", ability: "dexterity", amount: 1 },
      { type: "fixed", ability: "constitution", amount: 1 },
      { type: "fixed", ability: "intelligence", amount: 1 },
      { type: "fixed", ability: "wisdom", amount: 1 },
      { type: "fixed", ability: "charisma", amount: 1 },
    ],
  },
  {
    id: "humain-variant",
    name: "Humain variant",
    speed: 9,
    abilityBonusRules: [{ type: "choice", amount: 1, count: 2 }],
  },
  {
    id: "demi-elfe",
    name: "Demi-elfe",
    speed: 9,
    abilityBonusRules: [
      { type: "fixed", ability: "charisma", amount: 2 },
      { type: "choice", amount: 1, count: 2, exclude: ["charisma"] },
    ],
  },
];

export function findRaceDefinition(raceId: string): RaceDefinition | undefined {
  return RACE_DEFINITIONS.find((race) => race.id === raceId);
}
