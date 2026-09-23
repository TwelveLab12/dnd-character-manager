const NAMESPACE = "dnd-character-manager";
const SCHEMA_VERSION = 1;

interface StorageEnvelope<T> {
  schemaVersion: number;
  data: T;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Accès centralisé à `localStorage` pour une ressource donnée : clé namespacée et versionnée,
 * enveloppe `{ schemaVersion, data }` (pour permettre des migrations futures), parsing JSON
 * défensif, garde SSR. Voir docs/adr/0002-repository-pattern-localstorage-v1.md.
 */
export class LocalStorageClient<T> {
  private readonly key: string;
  private readonly fallback: T;

  constructor(resource: string, fallback: T) {
    this.key = `${NAMESPACE}:v1:${resource}`;
    this.fallback = fallback;
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
      const parsed = JSON.parse(raw) as StorageEnvelope<T>;
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        return this.fallback;
      }
      return parsed.data;
    } catch {
      return this.fallback;
    }
  }

  write(data: T): void {
    if (!isBrowser()) {
      return;
    }
    const envelope: StorageEnvelope<T> = { schemaVersion: SCHEMA_VERSION, data };
    window.localStorage.setItem(this.key, JSON.stringify(envelope));
  }
}
