import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import type { ActivityEntry, ActivityRetention } from "@/domain/activity-log";
import { DEFAULT_ACTIVITY_RETENTION, appendActivity, pruneActivity } from "@/domain/activity-log";
import type { ActivityLogRepository } from "@/repositories/contracts/activity-log-repository";

export interface ActivityLogStoreState {
  /** Historique chargé, par personnage (du plus ancien au plus récent). */
  entries: Partial<Record<string, ActivityEntry[]>>;
  retention: ActivityRetention;
  load: (characterId: string) => Promise<void>;
  record: (characterId: string, entry: ActivityEntry) => Promise<void>;
  clear: (characterId: string) => Promise<void>;
  setRetention: (retention: ActivityRetention) => Promise<void>;
}

export type ActivityLogStoreHook = UseBoundStore<StoreApi<ActivityLogStoreState>>;

/**
 * Historique des actions du mode jeu (docs/adr/0061). Les écritures sont mises en file : des clics
 * rapprochés s'enregistrent dans l'ordre, chacun sur l'historique à jour (regroupement compris).
 * Une écriture qui échoue (stockage plein) retente avec la moitié la plus récente, puis abandonne
 * sans jamais bloquer l'action de jeu.
 */
export function createActivityLogStore(
  repository: ActivityLogRepository,
  now: () => Date = () => new Date(),
): ActivityLogStoreHook {
  let queue: Promise<void> = Promise.resolve();
  let settingsLoaded = false;

  return create<ActivityLogStoreState>((set, get) => {
    function enqueue(task: () => Promise<void>): Promise<void> {
      queue = queue.then(task, task);
      return queue;
    }

    async function ensureSettings() {
      if (!settingsLoaded) {
        settingsLoaded = true;
        set({ retention: await repository.getRetention() });
      }
    }

    async function current(characterId: string): Promise<ActivityEntry[]> {
      return get().entries[characterId] ?? (await repository.list(characterId));
    }

    async function persist(characterId: string, entries: ActivityEntry[]) {
      try {
        await repository.save(characterId, entries);
      } catch {
        const half = entries.slice(entries.length - Math.floor(entries.length / 2));
        try {
          await repository.save(characterId, half);
          entries = half;
        } catch {
          // Stockage indisponible : l'historique reste en mémoire pour la session.
        }
      }
      set({ entries: { ...get().entries, [characterId]: entries } });
    }

    return {
      entries: {},
      retention: DEFAULT_ACTIVITY_RETENTION,

      load: (characterId) =>
        enqueue(async () => {
          await ensureSettings();
          const stored = await repository.list(characterId);
          const pruned = pruneActivity(stored, { now: now(), retention: get().retention });
          if (pruned.length !== stored.length) {
            await persist(characterId, pruned);
          } else {
            set({ entries: { ...get().entries, [characterId]: pruned } });
          }
        }),

      record: (characterId, entry) =>
        enqueue(async () => {
          await ensureSettings();
          const next = appendActivity(await current(characterId), entry, {
            now: now(),
            retention: get().retention,
          });
          await persist(characterId, next);
        }),

      clear: (characterId) =>
        enqueue(async () => {
          await repository.clear(characterId);
          set({ entries: { ...get().entries, [characterId]: [] } });
        }),

      setRetention: (retention) =>
        enqueue(async () => {
          settingsLoaded = true;
          await repository.setRetention(retention);
          set({ retention });
          // La nouvelle durée s'applique tout de suite aux historiques chargés.
          for (const [characterId, entries] of Object.entries(get().entries)) {
            if (entries) {
              const pruned = pruneActivity(entries, { now: now(), retention });
              if (pruned.length !== entries.length) {
                await persist(characterId, pruned);
              }
            }
          }
        }),
    };
  });
}
