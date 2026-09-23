import type { Character } from "@/domain/character";
import type { CharacterRepository } from "@/repositories/contracts/character-repository";

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

  async delete(id: string): Promise<void> {
    this.characters = this.characters.filter((existing) => existing.id !== id);
  }
}
