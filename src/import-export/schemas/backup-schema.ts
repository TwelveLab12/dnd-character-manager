import { z } from "zod";
import { characterSchema } from "./character-schema";
import { spellSchema } from "./spell-schema";

/**
 * Export combiné "toutes les données" — permet un aller-retour complet entre environnements
 * (export navigateur A -> import navigateur B). `schemaVersion` permet de faire évoluer le format
 * sans casser un backup existant. Voir docs/adr/0004-json-import-export-open5e-schema.md.
 */
export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  characters: z.array(characterSchema),
  spells: z.array(spellSchema),
});

export type Backup = z.infer<typeof backupSchema>;
