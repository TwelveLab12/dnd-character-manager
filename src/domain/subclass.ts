import type { ClassResourceId } from "./character-class";
import type { ArmorCategory, WeaponCategory } from "./inventory";

/**
 * Référence à un sort des règles, reconnue dans la bibliothèque de l'utilisateur par son nom : les
 * sorts ne sont pas bundlés dans l'app (docs/adr/0004), leurs ids sont choisis à l'import. Un sort
 * de la bibliothèque correspond si son nom contient l'un des `aliases` (français ou anglais,
 * comparaison insensible à la casse et aux accents).
 */
export interface SpellReference {
  name: string;
  aliases: readonly string[];
}

/** Option d'une ressource de classe accordée par les règles (ex : Renvoi des morts-vivants
 * consomme la Canalisation divine), disponible à partir d'un niveau de classe. */
export interface ClassResourceOptionDefinition {
  id: string;
  name: string;
  resourceId: ClassResourceId;
  minLevel: number;
}

export interface ProficiencyGrants {
  armor: readonly ArmorCategory[];
  weapons: readonly WeaponCategory[];
}

/**
 * Sous-classe (domaine divin du Clerc…) : uniquement de la mécanique (noms, niveaux, maîtrises),
 * aucun texte de règle reproduit — même logique que les races et les classes (docs/adr/0025).
 */
export interface SubclassDefinition {
  id: string;
  name: string;
  /** Libellés reconnus dans le champ texte `Character.subclass`. */
  aliases: readonly string[];
  /** Sorts toujours préparés, par niveau de classe minimum. */
  alwaysPreparedSpells: readonly { minLevel: number; spells: readonly SpellReference[] }[];
  proficiencies: ProficiencyGrants;
  resourceOptions: readonly ClassResourceOptionDefinition[];
}

/** Domaine du Crépuscule (Chaudron de Tasha). */
export const TWILIGHT_DOMAIN: SubclassDefinition = {
  id: "crepuscule",
  name: "Domaine du Crépuscule",
  aliases: ["domaine du crepuscule", "crepuscule", "twilight domain", "twilight"],
  alwaysPreparedSpells: [
    {
      minLevel: 1,
      spells: [
        { name: "Lueur féerique", aliases: ["faerie fire", "lueur feerique", "lumiere feerique"] },
        { name: "Sommeil", aliases: ["sleep", "sommeil"] },
      ],
    },
    {
      minLevel: 3,
      spells: [
        { name: "Rayon de lune", aliases: ["moonbeam", "rayon de lune", "lueur de lune"] },
        { name: "Voir l'invisibilité", aliases: ["see invisibility", "voir l'invisibilite"] },
      ],
    },
    {
      minLevel: 5,
      spells: [
        { name: "Aura de vitalité", aliases: ["aura of vitality", "aura de vitalite"] },
        {
          name: "Petite hutte de Léomund",
          aliases: ["tiny hut", "petite hutte", "hutte de leomund"],
        },
      ],
    },
    {
      minLevel: 7,
      spells: [
        { name: "Aura de vie", aliases: ["aura of life", "aura de vie"] },
        {
          name: "Invisibilité supérieure",
          aliases: ["greater invisibility", "invisibilite superieure", "invisibilite supreme"],
        },
      ],
    },
    {
      minLevel: 9,
      spells: [
        { name: "Cercle de pouvoir", aliases: ["circle of power", "cercle de pouvoir"] },
        { name: "Double illusoire", aliases: ["mislead", "double illusoire"] },
      ],
    },
  ],
  proficiencies: { armor: ["heavy"], weapons: ["martial"] },
  resourceOptions: [
    {
      id: "twilight-sanctuary",
      name: "Sanctuaire du Crépuscule",
      resourceId: "channel-divinity",
      minLevel: 2,
    },
  ],
};
