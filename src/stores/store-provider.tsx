"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import {
  useActivityLogRepository,
  useCharacterRepository,
  useSpellRepository,
} from "@/repositories/repository-provider";
import type { ActivityLogStoreHook, ActivityLogStoreState } from "./activity-log-store";
import { createActivityLogStore } from "./activity-log-store";
import type { CharacterStoreHook, CharacterStoreState } from "./character-store";
import { createCharacterStore } from "./character-store";
import type { SpellStoreHook, SpellStoreState } from "./spell-store";
import { createSpellStore } from "./spell-store";

interface Stores {
  characterStore: CharacterStoreHook;
  spellStore: SpellStoreHook;
  activityLogStore: ActivityLogStoreHook;
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
  const activityLogRepository = useActivityLogRepository();

  const stores = useMemo<Stores>(() => {
    const activityLogStore = createActivityLogStore(activityLogRepository);
    return {
      // Supprimer un personnage supprime aussi son historique (docs/adr/0061).
      characterStore: createCharacterStore(characterRepository, {
        onRemove: (id) => activityLogStore.getState().clear(id),
      }),
      spellStore: createSpellStore(spellRepository),
      activityLogStore,
    };
  }, [characterRepository, spellRepository, activityLogRepository]);

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

export function useActivityLogStore<T>(selector: (state: ActivityLogStoreState) => T): T {
  const { activityLogStore } = useStores();
  return activityLogStore(selector);
}

/** Hook Zustand brut de l'historique, pour enregistrer depuis une action (voir use-play-actions). */
export function useActivityLogStoreApi(): ActivityLogStoreHook {
  return useStores().activityLogStore;
}

/** Hook Zustand brut des sorts, pour lire leurs noms au moment d'une action. */
export function useSpellStoreApi(): SpellStoreHook {
  return useStores().spellStore;
}
