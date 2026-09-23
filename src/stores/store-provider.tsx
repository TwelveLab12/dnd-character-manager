"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useCharacterRepository, useSpellRepository } from "@/repositories/repository-provider";
import type { CharacterStoreHook, CharacterStoreState } from "./character-store";
import { createCharacterStore } from "./character-store";
import type { SpellStoreHook, SpellStoreState } from "./spell-store";
import { createSpellStore } from "./spell-store";

interface Stores {
  characterStore: CharacterStoreHook;
  spellStore: SpellStoreHook;
}

const StoreContext = createContext<Stores | null>(null);

/**
 * Instancie chaque store une seule fois (au-dessus de l'arbre de composants) à partir des
 * repositories fournis par RepositoryProvider, pour que tous les consommateurs partagent le même
 * état réactif. Un composant qui appellerait `createCharacterStore`/`createSpellStore` lui-même
 * obtiendrait sa propre instance isolée — c'est pour ça que les composants passent par les hooks
 * `useCharacterStore`/`useSpellStore` ci-dessous, jamais par les factories directement.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const characterRepository = useCharacterRepository();
  const spellRepository = useSpellRepository();

  const stores = useMemo<Stores>(
    () => ({
      characterStore: createCharacterStore(characterRepository),
      spellStore: createSpellStore(spellRepository),
    }),
    [characterRepository, spellRepository],
  );

  return <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>;
}

function useStores(): Stores {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within a StoreProvider");
  }
  return context;
}

export function useCharacterStore<T>(selector: (state: CharacterStoreState) => T): T {
  const { characterStore } = useStores();
  return characterStore(selector);
}

/**
 * Donne accès au hook Zustand brut (pas une valeur déjà sélectionnée) pour les cas où il faut
 * lire l'état au moment de l'action plutôt qu'une valeur de rendu fermée — voir
 * src/features/character-play/use-play-actions.ts.
 */
export function useCharacterStoreApi(): CharacterStoreHook {
  return useStores().characterStore;
}

export function useSpellStore<T>(selector: (state: SpellStoreState) => T): T {
  const { spellStore } = useStores();
  return spellStore(selector);
}
