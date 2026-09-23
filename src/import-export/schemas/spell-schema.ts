import { z } from "zod";

/**
 * Miroir du type domaine `Spell` (src/domain/spell.ts), aligné sur les champs standards
 * republiés par les API ouvertes du SRD (ex : open5e) — voir
 * docs/adr/0004-json-import-export-open5e-schema.md. `id` est requis ici : l'appelant (voir
 * importer.ts) le renseigne par défaut à partir du nom (slugify) avant validation si absent du
 * JSON importé.
 */
export const spellComponentsSchema = z.object({
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  materialDescription: z.string().min(1).optional(),
});

export const spellSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  level: z.number().int().min(0).max(9),
  school: z.string().min(1),
  castingTime: z.string().min(1),
  range: z.string().min(1),
  components: spellComponentsSchema,
  duration: z.string().min(1),
  concentration: z.boolean().default(false),
  ritual: z.boolean().default(false),
  description: z.string().min(1),
  higherLevel: z.string().min(1).optional(),
  classes: z.array(z.string()).default([]),
  source: z.string().min(1).optional(),
});
