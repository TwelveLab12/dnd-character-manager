/**
 * Historique des actions du mode jeu (docs/adr/0061) : entrées stockées à part des fiches, de la
 * plus ancienne à la plus récente, purgées par ancienneté et plafonnées en nombre.
 */

export type ActivityCategory =
  "combat" | "hit-points" | "spells" | "resources" | "inventory" | "rest" | "status";

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  combat: "Combat",
  "hit-points": "Points de vie",
  spells: "Sorts",
  resources: "Ressources",
  inventory: "Inventaire",
  rest: "Repos",
  status: "État",
};

export type ActivityValue = number | string;

/** Une valeur de la fiche qui change, figée au moment de l'action (libellés compris). */
export interface ActivityChange {
  /** Identifie la valeur suivie (ex : « hp », « slot:3 », « coin:gold ») pour le regroupement. */
  key: string;
  label: string;
  from: ActivityValue;
  to: ActivityValue;
  category: ActivityCategory;
}

/** Contexte donné par l'action elle-même (sort lancé, repos…), que la différence ne dit pas. */
export interface ActivityIntent {
  title: string;
  category: ActivityCategory;
  details?: string[];
}

export interface ActivityEntry {
  id: string;
  /** Date ISO de la dernière action regroupée dans l'entrée. */
  at: string;
  category: ActivityCategory;
  title: string;
  details?: string[];
  changes: ActivityChange[];
  /** Présente pour une entrée sans contexte : des actions de même clé, rapprochées, fusionnent. */
  mergeKey?: string;
}

/** Durées de conservation proposées, en jours (`null` : illimitée). */
export const ACTIVITY_RETENTION_CHOICES = [7, 30, 90, null] as const;
export type ActivityRetention = (typeof ACTIVITY_RETENTION_CHOICES)[number];
export const DEFAULT_ACTIVITY_RETENTION: ActivityRetention = 30;
/** Filet de sécurité, quelle que soit la durée de conservation. */
export const MAX_ACTIVITY_ENTRIES = 1000;
/** Deux actions sans contexte sur les mêmes valeurs, à moins de cet écart, fusionnent. */
export const ACTIVITY_MERGE_WINDOW_MS = 60_000;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isActivityRetention(value: unknown): value is ActivityRetention {
  return (ACTIVITY_RETENTION_CHOICES as readonly unknown[]).includes(value);
}

/** Titre d'une entrée sans contexte, déduit de ce qui a changé. */
export function activityTitle(changes: readonly ActivityChange[]): string {
  const [first] = changes;
  if (!first) {
    return "";
  }
  if (changes.length === 1 && first.key === "hp" && typeof first.from === "number") {
    return Number(first.to) < first.from ? "Dégâts" : "Soins";
  }
  if (changes.length === 1 || changes.every((change) => change.key === first.key)) {
    return first.label;
  }
  // Une chute à 0 PV s'accompagne du changement d'état : le titre reste celui des PV.
  const hitPoints = changes.find((change) => change.key === "hp");
  if (hitPoints && typeof hitPoints.from === "number") {
    return Number(hitPoints.to) < hitPoints.from ? "Dégâts" : "Soins";
  }
  return ACTIVITY_CATEGORY_LABELS[first.category];
}

/** Entrée d'historique : celle d'une action avec contexte, ou déduite des changements. */
export function buildActivityEntry(
  changes: ActivityChange[],
  intent: ActivityIntent | undefined,
  { id, at }: { id: string; at: string },
): ActivityEntry | undefined {
  if (intent) {
    return {
      id,
      at,
      category: intent.category,
      title: intent.title,
      ...(intent.details && intent.details.length > 0 ? { details: intent.details } : {}),
      changes,
    };
  }
  const [first] = changes;
  if (!first) {
    return undefined;
  }
  return {
    id,
    at,
    category: changes.find((change) => change.key === "hp")?.category ?? first.category,
    title: activityTitle(changes),
    changes,
    mergeKey: changes
      .map((change) => change.key)
      .sort()
      .join("|"),
  };
}

/** Retire les entrées plus anciennes que la durée de conservation et garde les plus récentes. */
export function pruneActivity(
  entries: readonly ActivityEntry[],
  { now, retention }: { now: Date; retention: ActivityRetention },
): ActivityEntry[] {
  const threshold = retention === null ? undefined : now.getTime() - retention * DAY_MS;
  const kept =
    threshold === undefined
      ? [...entries]
      : entries.filter((entry) => Date.parse(entry.at) >= threshold);
  return kept.slice(-MAX_ACTIVITY_ENTRIES);
}

function mergeInto(previous: ActivityEntry, next: ActivityEntry): ActivityEntry | undefined {
  const changes = next.changes
    .map((change) => {
      const earlier = previous.changes.find((candidate) => candidate.key === change.key);
      return earlier ? { ...change, from: earlier.from } : change;
    })
    .filter((change) => change.from !== change.to);
  if (changes.length === 0) {
    return undefined;
  }
  return { ...previous, at: next.at, changes, title: activityTitle(changes) };
}

/**
 * Ajoute une entrée : une action sans contexte fusionne avec la précédente si elle porte sur les
 * mêmes valeurs dans la fenêtre de regroupement (ex : clics successifs sur −1 PV). Une fusion qui
 * revient au point de départ (−1 puis +1) efface l'entrée. Purge ensuite l'historique.
 */
export function appendActivity(
  entries: readonly ActivityEntry[],
  entry: ActivityEntry,
  options: { now: Date; retention: ActivityRetention },
): ActivityEntry[] {
  const previous = entries.at(-1);
  const mergeable =
    previous !== undefined &&
    entry.mergeKey !== undefined &&
    previous.mergeKey === entry.mergeKey &&
    Date.parse(entry.at) - Date.parse(previous.at) <= ACTIVITY_MERGE_WINDOW_MS;

  let next: ActivityEntry[];
  if (mergeable) {
    const merged = mergeInto(previous, entry);
    next = [...entries.slice(0, -1), ...(merged ? [merged] : [])];
  } else {
    next = [...entries, entry];
  }
  return pruneActivity(next, options);
}
