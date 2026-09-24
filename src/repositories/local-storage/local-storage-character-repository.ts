import type { Character } from "@/domain/character";
import type { CharacterRepository, UpsertManyResult } from "../contracts/character-repository";
import { normalizeLegacyCharacter } from "@/domain/migrations/normalize-legacy-character";
import { LocalStorageClient } from "./local-storage-client";

/**
 * Versions du format des personnages :
 * - 1 : format d'origine ;
 * - 2 : valeurs dérivées calculées (classId, emplacements utilisés seulement, ressources de classe)
 *   — voir docs/adr/0022 et 0023 ;
 * - 3 : sous-classe connue (subclassId), déduite du libellé libre — voir docs/adr/0025 ;
 * - 4 : jets de sauvegarde de classe, vitesse et initiative calculés — voir docs/adr/0026 ;
 * - 5 : PV max calculés (dé de vie, valeur fixe ou dés lancés) — voir docs/adr/0027 ;
 * - 6 : dons connus (featIds), déduits des capacités — voir docs/adr/0028.
 *
 * La normalisation étant idempotente, une seule fonction migre depuis n'importe quelle version.
 */
const CHARACTERS_SCHEMA_VERSION = 6;

function migrateCharacters(data: unknown): Character[] {
  return Array.isArray(data) ? (data.map(normalizeLegacyCharacter) as Character[]) : [];
}

export class LocalStorageCharacterRepository implements CharacterRepository {
  private readonly store = new LocalStorageClient<Character[]>("characters", [], {
    schemaVersion: CHARACTERS_SCHEMA_VERSION,
    migrate: migrateCharacters,
  });

  async list(): Promise<Character[]> {
    return this.store.read();
  }

  async getById(id: string): Promise<Character | null> {
    return this.store.read().find((character) => character.id === id) ?? null;
  }

  async create(character: Character): Promise<Character> {
    const characters = this.store.read();
    if (characters.some((existing) => existing.id === character.id)) {
      throw new Error(`Character with id "${character.id}" already exists`);
    }
    this.store.write([...characters, character]);
    return character;
  }

  async update(id: string, character: Character): Promise<Character> {
    const characters = this.store.read();
    const index = characters.findIndex((existing) => existing.id === id);
    if (index === -1) {
      throw new Error(`Character with id "${id}" not found`);
    }
    const updated: Character = { ...character, id, updatedAt: new Date().toISOString() };
    const next = [...characters];
    next[index] = updated;
    this.store.write(next);
    return updated;
  }

  async upsertMany(characters: Character[]): Promise<UpsertManyResult> {
    const byId = new Map(this.store.read().map((character) => [character.id, character]));
    let added = 0;
    let updated = 0;
    for (const character of characters) {
      if (byId.has(character.id)) {
        updated += 1;
      } else {
        added += 1;
      }
      byId.set(character.id, character);
    }
    this.store.write([...byId.values()]);
    return { added, updated, skipped: 0 };
  }

  async delete(id: string): Promise<void> {
    const characters = this.store.read();
    this.store.write(characters.filter((existing) => existing.id !== id));
  }
}
