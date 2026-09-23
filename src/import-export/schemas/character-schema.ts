import { z } from "zod";

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

const hitPointsSchema = z.object({
  current: z.number(),
  max: z.number(),
  temporary: z.number(),
});

const spellSlotLevelSchema = z.object({
  level: z.number().int().min(1).max(9),
  total: z.number().int().min(0),
  used: z.number().int().min(0),
});

const spellcastingInfoSchema = z.object({
  ability: abilityNameSchema,
  spellSaveDCOverride: z.number().optional(),
  spellAttackBonusOverride: z.number().optional(),
});

const concentrationSchema = z.object({
  active: z.boolean(),
  spellId: z.string().min(1).optional(),
});

const inventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number(),
  weight: z.number().optional(),
  description: z.string().min(1).optional(),
  equipped: z.boolean().optional(),
});

const featureRechargeSchema = z.enum(["shortRest", "longRest", "other"]);

const characterFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.string(),
  description: z.string(),
  usesMax: z.number().optional(),
  usesCurrent: z.number().optional(),
  recharge: featureRechargeSchema.optional(),
});

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  class: z.string().min(1),
  subclass: z.string().min(1).optional(),
  level: z.number().int().min(1).max(20),
  race: z.string().min(1).optional(),
  background: z.string().min(1).optional(),
  hitPoints: hitPointsSchema,
  armorClass: z.number(),
  initiativeBonus: z.number(),
  speed: z.number(),
  abilityScores: abilityScoresSchema,
  savingThrowProficiencies: z.array(abilityNameSchema).default([]),
  skillProficiencies: z.array(z.string()).default([]),
  concentration: concentrationSchema,
  meleeAttackBonus: z.number().optional(),
  rangedAttackBonus: z.number().optional(),
  spellcasting: spellcastingInfoSchema.optional(),
  spellSlots: z.array(spellSlotLevelSchema).default([]),
  knownSpellIds: z.array(z.string()).default([]),
  preparedSpellIds: z.array(z.string()).default([]),
  inventory: z.array(inventoryItemSchema).default([]),
  features: z.array(characterFeatureSchema).default([]),
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
