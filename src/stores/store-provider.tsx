"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useCharacterRepository } from "@/repositories/repository-provider";
import type { CharacterStoreHook, CharacterStoreState } from "./character-store";
import { createCharacterStore } from "./character-store";

interface Stores {
  characterStore: CharacterStoreHook;
}

const StoreContext = createContext<Stores | null>(null);

/**
 * Instancie chaque store une seule fois (au-dessus de l'arbre de composants) à partir des
 * repositories fournis par RepositoryProvider, pour que tous les consommateurs partagent le même
 * état réactif. Un composant qui appellerait `createCharacterStore` lui-même obtiendrait sa propre
 * instance isolée — c'est pour ça que les composants passent par `useCharacterStore` ci-dessous,
 * jamais par la factory directement.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const characterRepository = useCharacterRepository();

  const stores = useMemo<Stores>(
    () => ({ characterStore: createCharacterStore(characterRepository) }),
    [characterRepository],
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
