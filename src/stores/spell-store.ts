import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import type { Spell } from "@/domain/spell";
import type { SpellRepository, UpsertManyResult } from "@/repositories/contracts/spell-repository";

export interface SpellStoreState {
  spells: Spell[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsertMany: (spells: Spell[]) => Promise<UpsertManyResult>;
  remove: (id: string) => Promise<void>;
}

export type SpellStoreHook = UseBoundStore<StoreApi<SpellStoreState>>;

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/** Voir docs/adr/0003-zustand-stores-over-repositories.md. */
export function createSpellStore(repository: SpellRepository): SpellStoreHook {
  return create<SpellStoreState>((set, get) => ({
    spells: [],
    isLoading: false,
    error: null,

    load: async () => {
      set({ isLoading: true, error: null });
      try {
        const spells = await repository.list();
        set({ spells, isLoading: false });
      } catch (error) {
        set({ error: toErrorMessage(error), isLoading: false });
      }
    },

    upsertMany: async (spells) => {
      const result = await repository.upsertMany(spells);
      const byId = new Map(get().spells.map((spell) => [spell.id, spell]));
      for (const spell of spells) {
        byId.set(spell.id, spell);
      }
      set({ spells: [...byId.values()] });
      return result;
    },

    remove: async (id) => {
      await repository.delete(id);
      set({ spells: get().spells.filter((existing) => existing.id !== id) });
    },
  }));
}
