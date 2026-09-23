"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { CharacterRepository } from "./contracts/character-repository";
import type { SpellRepository } from "./contracts/spell-repository";
import { LocalStorageCharacterRepository } from "./local-storage/local-storage-character-repository";
import { LocalStorageSpellRepository } from "./local-storage/local-storage-spell-repository";

interface Repositories {
  characterRepository: CharacterRepository;
  spellRepository: SpellRepository;
}

const RepositoryContext = createContext<Repositories | null>(null);

/**
 * Point d'instanciation unique des repositories — c'est ici, et seulement ici, qu'une future
 * implémentation API/DB remplacerait les implémentations localStorage. Voir
 * docs/adr/0002-repository-pattern-localstorage-v1.md.
 */
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const repositories = useMemo<Repositories>(
    () => ({
      characterRepository: new LocalStorageCharacterRepository(),
      spellRepository: new LocalStorageSpellRepository(),
    }),
    [],
  );

  return <RepositoryContext.Provider value={repositories}>{children}</RepositoryContext.Provider>;
}

function useRepositories(): Repositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepositories must be used within a RepositoryProvider");
  }
  return context;
}

export function useCharacterRepository(): CharacterRepository {
  return useRepositories().characterRepository;
}

export function useSpellRepository(): SpellRepository {
  return useRepositories().spellRepository;
}
