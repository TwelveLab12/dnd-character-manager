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

/** Cercle des spores (Chaudron de Tasha). Contact glacial est un tour de magie appris au niveau 2 :
 * rangé avec les sorts toujours préparés, il reste disponible sans préparation comme eux. */
export const CIRCLE_OF_SPORES: SubclassDefinition = {
  id: "spores",
  name: "Cercle des spores",
  aliases: ["cercle des spores", "spores", "circle of spores"],
  alwaysPreparedSpells: [
    {
      minLevel: 2,
      spells: [{ name: "Contact glacial", aliases: ["chill touch", "contact glacial"] }],
    },
    {
      minLevel: 3,
      spells: [
        {
          name: "Cécité/Surdité",
          aliases: ["blindness/deafness", "cecite / surdite", "cecite/surdite", "aveuglement"],
        },
        {
          name: "Préservation des morts",
          aliases: ["gentle repose", "preservation des morts", "repos paisible"],
        },
      ],
    },
    {
      minLevel: 5,
      spells: [
        { name: "Animation des morts", aliases: ["animate dead", "animation des morts"] },
        { name: "Forme gazeuse", aliases: ["gaseous form", "forme gazeuse"] },
      ],
    },
    {
      minLevel: 7,
      spells: [
        { name: "Flétrissement", aliases: ["blight", "fletrissement"] },
        { name: "Confusion", aliases: ["confusion"] },
      ],
    },
    {
      minLevel: 9,
      spells: [
        { name: "Brume mortelle", aliases: ["cloudkill", "brume mortelle", "nuage mortel"] },
        { name: "Contagion", aliases: ["contagion"] },
      ],
    },
  ],
  proficiencies: { armor: [], weapons: [] },
  resourceOptions: [
    { id: "symbiotic-entity", name: "Entité symbiotique", resourceId: "wild-shape", minLevel: 2 },
  ],
};
