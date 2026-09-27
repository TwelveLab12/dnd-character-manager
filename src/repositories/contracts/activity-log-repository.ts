import type { ActivityEntry, ActivityRetention } from "@/domain/activity-log";

/**
 * Historique des actions du mode jeu (docs/adr/0061), stocké à part des fiches : une liste par
 * personnage, de la plus ancienne à la plus récente, et la durée de conservation (réglage commun
 * à tous les personnages). Méthodes async comme les autres repositories (docs/adr/0002).
 */
export interface ActivityLogRepository {
  list(characterId: string): Promise<ActivityEntry[]>;
  save(characterId: string, entries: ActivityEntry[]): Promise<void>;
  clear(characterId: string): Promise<void>;
  getRetention(): Promise<ActivityRetention>;
  setRetention(retention: ActivityRetention): Promise<void>;
}
