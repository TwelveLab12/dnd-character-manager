import type { ActivityEntry, ActivityRetention } from "@/domain/activity-log";
import { DEFAULT_ACTIVITY_RETENTION, isActivityRetention } from "@/domain/activity-log";
import type { ActivityLogRepository } from "../contracts/activity-log-repository";
import { LocalStorageClient } from "./local-storage-client";

interface ActivitySettings {
  retention?: ActivityRetention;
}

/**
 * Une clé localStorage par personnage (`activity:<id>`) : l'historique n'alourdit ni la fiche ni
 * le chargement de la liste des personnages, et n'est lu qu'à l'ouverture du panneau ou à la
 * première action enregistrée (docs/adr/0061).
 */
export class LocalStorageActivityLogRepository implements ActivityLogRepository {
  private readonly settings = new LocalStorageClient<ActivitySettings>("activity-settings", {});

  private client(characterId: string) {
    return new LocalStorageClient<ActivityEntry[]>(`activity:${characterId}`, []);
  }

  async list(characterId: string): Promise<ActivityEntry[]> {
    const entries = this.client(characterId).read();
    return Array.isArray(entries) ? entries : [];
  }

  async save(characterId: string, entries: ActivityEntry[]): Promise<void> {
    this.client(characterId).write(entries);
  }

  async clear(characterId: string): Promise<void> {
    this.client(characterId).remove();
  }

  async getRetention(): Promise<ActivityRetention> {
    const { retention } = this.settings.read();
    return isActivityRetention(retention) ? retention : DEFAULT_ACTIVITY_RETENTION;
  }

  async setRetention(retention: ActivityRetention): Promise<void> {
    this.settings.write({ retention });
  }
}
