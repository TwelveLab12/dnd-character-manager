import type { Spell } from "@/domain/spell";

export interface UpsertManyResult {
  added: number;
  updated: number;
  skipped: number;
}

/** Voir docs/adr/0002-repository-pattern-localstorage-v1.md. */
export interface SpellRepository {
  list(): Promise<Spell[]>;
  getById(id: string): Promise<Spell | null>;
  /** Insère ou remplace par `id` ; utilisé par le flux d'import (voir docs/adr/0004). */
  upsertMany(spells: Spell[]): Promise<UpsertManyResult>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}
