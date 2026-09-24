const NAMESPACE = "dnd-character-manager";
const INITIAL_SCHEMA_VERSION = 1;

interface StorageEnvelope<T> {
  schemaVersion: number;
  data: T;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export interface LocalStorageClientOptions<T> {
  /** Version courante du format de cette ressource (1 par défaut). */
  schemaVersion?: number;
  /** Convertit des données d'une version antérieure vers le format courant. Sans migration, une
   * version différente est ignorée (repli sur `fallback`). */
  migrate?: (data: unknown, fromVersion: number) => T;
}

/**
 * Accès centralisé à `localStorage` pour une ressource donnée : clé namespacée et versionnée,
 * enveloppe `{ schemaVersion, data }` (pour permettre des migrations futures), parsing JSON
 * défensif, garde SSR. Voir docs/adr/0002-repository-pattern-localstorage-v1.md.
 *
 * Évolution du format : chaque ressource déclare sa version ; des données plus anciennes sont
 * migrées à la lecture puis réécrites au format courant — jamais abandonnées. Le `v1` de la clé
 * est l'espace de nommage d'origine, pas la version du format (voir docs/adr/0023).
 */
export class LocalStorageClient<T> {
  private readonly key: string;
  private readonly fallback: T;
  private readonly schemaVersion: number;
  private readonly migrate?: (data: unknown, fromVersion: number) => T;

  constructor(resource: string, fallback: T, options: LocalStorageClientOptions<T> = {}) {
    this.key = `${NAMESPACE}:v1:${resource}`;
    this.fallback = fallback;
    this.schemaVersion = options.schemaVersion ?? INITIAL_SCHEMA_VERSION;
    this.migrate = options.migrate;
  }

  read(): T {
    if (!isBrowser()) {
      return this.fallback;
    }
    const raw = window.localStorage.getItem(this.key);
    if (!raw) {
      return this.fallback;
    }
    try {
      const parsed = JSON.parse(raw) as StorageEnvelope<unknown>;
      if (parsed.schemaVersion === this.schemaVersion) {
        return parsed.data as T;
      }
      if (this.migrate && parsed.schemaVersion < this.schemaVersion) {
        const migrated = this.migrate(parsed.data, parsed.schemaVersion);
        this.write(migrated);
        return migrated;
      }
      return this.fallback;
    } catch {
      return this.fallback;
    }
  }

  write(data: T): void {
    if (!isBrowser()) {
      return;
    }
    const envelope: StorageEnvelope<T> = { schemaVersion: this.schemaVersion, data };
    window.localStorage.setItem(this.key, JSON.stringify(envelope));
  }
}
