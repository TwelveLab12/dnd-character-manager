import type { Character } from "@/domain/character";
import type {
  CharacterRepository,
  UpsertManyResult,
} from "@/repositories/contracts/character-repository";

/** Repository en mémoire pour tester la couche store en isolation, sans localStorage/jsdom. */
export class InMemoryCharacterRepository implements CharacterRepository {
  private characters: Character[] = [];

  async list(): Promise<Character[]> {
    return [...this.characters];
  }

  async getById(id: string): Promise<Character | null> {
    return this.characters.find((character) => character.id === id) ?? null;
  }

  async create(character: Character): Promise<Character> {
    this.characters = [...this.characters, character];
    return character;
  }

  async update(id: string, character: Character): Promise<Character> {
    this.characters = this.characters.map((existing) =>
      existing.id === id ? character : existing,
    );
    return character;
  }

  async upsertMany(characters: Character[]): Promise<UpsertManyResult> {
    const byId = new Map(this.characters.map((character) => [character.id, character]));
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
    this.characters = [...byId.values()];
    return { added, updated, skipped: 0 };
  }

  async delete(id: string): Promise<void> {
    this.characters = this.characters.filter((existing) => existing.id !== id);
  }
}
