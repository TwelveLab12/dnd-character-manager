import { z } from "zod";
import { CLASS_RESOURCE_IDS } from "@/domain/character-class";
import { normalizeLegacyCharacter } from "@/domain/migrations/normalize-legacy-character";

/**
 * Miroir du type domaine `Character` (src/domain/character.ts). `id` est requis ici : l'appelant
 * (voir character-importer.ts) le renseigne par défaut (id généré) avant validation si absent du
 * JSON importé. `createdAt`/`updatedAt` sont optionnels à l'import (un JSON écrit à la main n'a
 * pas forcément ces champs) et se voient attribuer l'instant présent par défaut.
 */
const abilityNameSchema = z.enum([
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
]);

const abilityScoresSchema = z.object({
  strength: z.number(),
  dexterity: z.number(),
  constitution: z.number(),
  intelligence: z.number(),
  wisdom: z.number(),
  charisma: z.number(),
});

// Pas de `max` : les PV max sont calculés (docs/adr/0027).
const hitPointsSchema = z.object({
  current: z.number(),
  temporary: z.number(),
});

// Clés = niveau de sort (1-9) ; JSON ne connaît que des clés texte.
const spellSlotsUsedSchema = z.partialRecord(z.string().regex(/^[1-9]$/), z.number().int().min(0));

const classResourcesUsedSchema = z.partialRecord(
  z.enum(CLASS_RESOURCE_IDS),
  z.number().int().min(0),
);

const spellcastingInfoSchema = z.object({
  ability: abilityNameSchema.optional(),
  spellSaveDCOverride: z.number().optional(),
  spellAttackBonusOverride: z.number().optional(),
  preparedSpellsMaxOverride: z.number().int().min(0).optional(),
});

const concentrationSchema = z.object({
  active: z.boolean(),
  spellId: z.string().min(1).optional(),
});

const raceSelectionSchema = z.object({
  raceId: z.string().min(1),
  abilityBonusChoices: z.array(abilityNameSchema).default([]),
});

const armorCategorySchema = z.enum(["light", "medium", "heavy", "shield"]);

const armorPropertiesSchema = z.object({
  category: armorCategorySchema,
  baseArmorClass: z.number(),
  strengthRequirement: z.number().optional(),
});

const weaponCategorySchema = z.enum(["simple", "martial"]);

const weaponPropertiesSchema = z.object({
  category: weaponCategorySchema,
  range: z.enum(["melee", "ranged"]),
  // Pas de regex stricte sur les dés : une faute de frappe ne doit pas rendre tout un personnage
  // non importable depuis une sauvegarde — l'UI signale le format invalide à la saisie.
  damageDice: z.string(),
  versatileDamageDice: z.string().min(1).optional(),
  damageType: z.enum([
    "bludgeoning",
    "piercing",
    "slashing",
    "acid",
    "cold",
    "fire",
    "force",
    "lightning",
    "necrotic",
    "poison",
    "psychic",
    "radiant",
    "thunder",
  ]),
  finesse: z.boolean().optional(),
  magicBonus: z.number().optional(),
  twoHanded: z.boolean().optional(),
  light: z.boolean().optional(),
  thrown: z.object({ normal: z.number(), long: z.number() }).optional(),
  monkWeapon: z.boolean().optional(),
});

const inventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number(),
  weight: z.number().optional(),
  description: z.string().min(1).optional(),
  equipped: z.boolean().optional(),
  armor: armorPropertiesSchema.optional(),
  weapon: weaponPropertiesSchema.optional(),
  hand: z.enum(["main", "off"]).optional(),
  stowed: z.boolean().optional(),
  armorClassBonus: z.number().optional(),
});

const armorClassEffectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  bonus: z.number(),
  trigger: z.discriminatedUnion("type", [
    z.object({ type: z.literal("concentration"), spellId: z.string().min(1) }),
    z.object({ type: z.literal("manual"), active: z.boolean() }),
  ]),
});

const featureRechargeSchema = z.enum(["shortRest", "longRest", "other"]);

const characterSpellTagSchema = z.object({
  spellId: z.string().min(1),
  domain: z.string().min(1).optional(),
  alwaysPrepared: z.boolean(),
});

const characterFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.string(),
  description: z.string(),
  usesMax: z.number().optional(),
  usesCurrent: z.number().optional(),
  recharge: featureRechargeSchema.optional(),
  resourceId: z.enum(CLASS_RESOURCE_IDS).optional(),
});

const coinAmountSchema = z.number().int().min(0).default(0);

/** Bourse : une monnaie absente vaut 0 — voir docs/adr/0029. */
const currencySchema = z.object({
  platinum: coinAmountSchema,
  gold: coinAmountSchema,
  electrum: coinAmountSchema,
  silver: coinAmountSchema,
  copper: coinAmountSchema,
});

const currentCharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  class: z.string().min(1),
  classId: z.string().min(1).optional(),
  subclass: z.string().min(1).optional(),
  subclassId: z.string().min(1).optional(),
  level: z.number().int().min(1).max(20),
  race: z.string().min(1).optional(),
  raceSelection: raceSelectionSchema.optional(),
  background: z.string().min(1).optional(),
  hitPoints: hitPointsSchema,
  hitPointMethod: z.enum(["fixed", "rolled"]).optional(),
  hitPointRolls: z.array(z.number().int().min(1)).optional(),
  baseMaxHitPoints: z.number().int().min(1).optional(),
  featIds: z.array(z.string().min(1)).optional(),
  // Pas de `armorClass` : la CA est calculée. Un ancien JSON qui la contient reste importable
  // (clé inconnue ignorée par z.object).
  armorProficiencies: z.array(armorCategorySchema).optional(),
  removedArmorProficiencies: z.array(armorCategorySchema).optional(),
  mediumArmorMaster: z.boolean().optional(),
  armorClassEffects: z.array(armorClassEffectSchema).optional(),
  // Initiative et vitesse sont calculées (docs/adr/0026) : seuls un bonus d'initiative hors
  // Dextérité et une vitesse de base pour une race hors registre sont stockés.
  initiativeExtraBonus: z.number().optional(),
  speedExtraBonus: z.number().optional(),
  baseSpeed: z.number().optional(),
  abilityScores: abilityScoresSchema,
  savingThrowProficiencies: z.array(abilityNameSchema).default([]),
  removedSavingThrowProficiencies: z.array(abilityNameSchema).optional(),
  removedClassResourceOptions: z.array(z.string().min(1)).optional(),
  skillProficiencies: z.array(z.string()).default([]),
  concentration: concentrationSchema,
  // Pas de `meleeAttackBonus`/`rangedAttackBonus` : calculés par arme équipée. Un ancien JSON
  // qui les contient reste importable (clés inconnues ignorées par z.object).
  weaponProficiencies: z.array(weaponCategorySchema).optional(),
  removedWeaponProficiencies: z.array(weaponCategorySchema).optional(),
  martialArts: z.boolean().optional(),
  dualWielder: z.boolean().optional(),
  twoWeaponFightingStyle: z.boolean().optional(),
  spellcasting: spellcastingInfoSchema.optional(),
  // Pas de totaux d'emplacements ni de maximum de ressources : calculés (docs/adr/0022).
  spellSlotsUsed: spellSlotsUsedSchema.default({}),
  classResourcesUsed: classResourcesUsedSchema.default({}),
  knownSpellIds: z.array(z.string()).default([]),
  preparedSpellIds: z.array(z.string()).default([]),
  spellTags: z.array(characterSpellTagSchema).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
  currency: currencySchema.optional(),
  features: z.array(characterFeatureSchema).default([]),
  themeId: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  createdAt: z
    .string()
    .min(1)
    .default(() => new Date().toISOString()),
  updatedAt: z
    .string()
    .min(1)
    .default(() => new Date().toISOString()),
});

/**
 * Un JSON au format antérieur (emplacements stockés, compteurs de Canalisation divine par
 * capacité…) est d'abord normalisé vers le format courant — voir docs/adr/0023.
 */
export const characterSchema = z.preprocess(normalizeLegacyCharacter, currentCharacterSchema);
