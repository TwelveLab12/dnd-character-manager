import type { Spell } from "@/domain/spell";
import type { SpellRepository, UpsertManyResult } from "../contracts/spell-repository";
import { LocalStorageClient } from "./local-storage-client";

export class LocalStorageSpellRepository implements SpellRepository {
  private readonly store = new LocalStorageClient<Spell[]>("spells", []);

  async list(): Promise<Spell[]> {
    return this.store.read();
  }

  async getById(id: string): Promise<Spell | null> {
    return this.store.read().find((spell) => spell.id === id) ?? null;
  }

  async upsertMany(spells: Spell[]): Promise<UpsertManyResult> {
    const byId = new Map(this.store.read().map((spell) => [spell.id, spell]));
    let added = 0;
    let updated = 0;
    for (const spell of spells) {
      if (byId.has(spell.id)) {
        updated += 1;
      } else {
        added += 1;
      }
      byId.set(spell.id, spell);
    }
    this.store.write([...byId.values()]);
    return { added, updated, skipped: 0 };
  }

  async delete(id: string): Promise<void> {
    const spells = this.store.read();
    this.store.write(spells.filter((spell) => spell.id !== id));
  }

  async clear(): Promise<void> {
    this.store.write([]);
  }
}
