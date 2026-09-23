import type { Character } from "@/domain/character";
import type { UpsertManyResult } from "./upsert-many-result";

export type { UpsertManyResult };

/**
 * Contrat indépendant de l'implémentation — voir docs/adr/0002-repository-pattern-localstorage-v1.md.
 * Méthodes async dès le v1 (localStorage) pour que brancher une implémentation API/DB plus tard ne
 * change aucun appelant.
 */
export interface CharacterRepository {
  list(): Promise<Character[]>;
  getById(id: string): Promise<Character | null>;
  create(character: Character): Promise<Character>;
  update(id: string, character: Character): Promise<Character>;
  /** Insère ou remplace par `id` ; utilisé par le flux d'import (voir docs/adr/0004). */
  upsertMany(characters: Character[]): Promise<UpsertManyResult>;
  delete(id: string): Promise<void>;
}
