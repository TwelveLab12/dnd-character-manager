import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import type { Character } from "@/domain/character";
import type {
  CharacterRepository,
  UpsertManyResult,
} from "@/repositories/contracts/character-repository";

export interface CharacterStoreState {
  characters: Character[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  create: (character: Character) => Promise<void>;
  update: (id: string, character: Character) => Promise<Character>;
  upsertMany: (characters: Character[]) => Promise<UpsertManyResult>;
  remove: (id: string) => Promise<void>;
}

export type CharacterStoreHook = UseBoundStore<StoreApi<CharacterStoreState>>;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Factory recevant le repository en paramètre plutôt que de l'importer — reste testable en
 * isolation avec un repository en mémoire factice, sans monter de composant React ni de Context.
 * Voir docs/adr/0003-zustand-stores-over-repositories.md.
 */
export function createCharacterStore(repository: CharacterRepository): CharacterStoreHook {
  return create<CharacterStoreState>((set, get) => ({
    characters: [],
    isLoading: false,
    error: null,

    load: async () => {
      set({ isLoading: true, error: null });
      try {
        const characters = await repository.list();
        set({ characters, isLoading: false });
      } catch (error) {
        set({ error: toErrorMessage(error), isLoading: false });
      }
    },

    create: async (character) => {
      await repository.create(character);
      set({ characters: [...get().characters, character] });
    },

    update: async (id, character) => {
      const updated = await repository.update(id, character);
      set({
        characters: get().characters.map((existing) => (existing.id === id ? updated : existing)),
      });
      return updated;
    },

    upsertMany: async (characters) => {
      const result = await repository.upsertMany(characters);
      const byId = new Map(get().characters.map((character) => [character.id, character]));
      for (const character of characters) {
        byId.set(character.id, character);
      }
      set({ characters: [...byId.values()] });
      return result;
    },

    remove: async (id) => {
      await repository.delete(id);
      set({ characters: get().characters.filter((existing) => existing.id !== id) });
    },
  }));
}
