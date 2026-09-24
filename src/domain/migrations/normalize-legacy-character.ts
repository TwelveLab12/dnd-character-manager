import { findClassDefinition, findClassDefinitionByLabel } from "../character-class";

/**
 * Capacités reconnues comme puisant dans la Canalisation divine du Clerc, dans les données
 * antérieures aux ressources de classe (où chacune avait son propre compteur).
 */
const CHANNEL_DIVINITY_FEATURE_PATTERNS: readonly RegExp[] = [
  /canalisation divine/i,
  /channel divinity/i,
  /renvoi des morts[- ]vivants/i,
  /turn undead/i,
  /sanctuaire du cr[ée]puscule/i,
  /twilight sanctuary/i,
];

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** `class` libre → `classId` connu, si absent et reconnaissable. */
function withClassId(record: RawRecord): RawRecord {
  if (typeof record.classId === "string" || typeof record.class !== "string") {
    return record;
  }
  const definition = findClassDefinitionByLabel(record.class);
  return definition ? { ...record, classId: definition.id } : record;
}

/** Ancien `spellSlots: { level, total, used }[]` → `spellSlotsUsed` (les totaux sont calculés). */
function withSpellSlotsUsed(record: RawRecord): RawRecord {
  if (!("spellSlots" in record)) {
    return record;
  }
  const { spellSlots, ...rest } = record;
  if (isRecord(rest.spellSlotsUsed) || !Array.isArray(spellSlots)) {
    return rest;
  }
  const spellSlotsUsed: Record<string, number> = {};
  for (const slot of spellSlots) {
    if (!isRecord(slot)) continue;
    const level = asNumber(slot.level);
    const used = asNumber(slot.used);
    if (level !== undefined && used !== undefined && used > 0) {
      spellSlotsUsed[String(level)] = used;
    }
  }
  return { ...rest, spellSlotsUsed };
}

/**
 * Capacités de Canalisation divine d'un Clerc → liées à la ressource `channel-divinity` (sans
 * compteur propre) ; la plus forte consommation relevée devient la consommation de la réserve.
 */
function withChannelDivinityResource(record: RawRecord): RawRecord {
  const classId = typeof record.classId === "string" ? record.classId : undefined;
  const hasChannelDivinity = findClassDefinition(classId)?.resources.some(
    (resource) => resource.id === "channel-divinity",
  );
  if (!hasChannelDivinity || !Array.isArray(record.features)) {
    return record;
  }

  let spent = 0;
  let changed = false;
  const features = record.features.map((feature) => {
    if (!isRecord(feature) || feature.resourceId !== undefined) {
      return feature;
    }
    const label = `${String(feature.name ?? "")} ${String(feature.source ?? "")}`;
    if (!CHANNEL_DIVINITY_FEATURE_PATTERNS.some((pattern) => pattern.test(label))) {
      return feature;
    }
    changed = true;
    const usesMax = asNumber(feature.usesMax);
    const usesCurrent = asNumber(feature.usesCurrent);
    if (usesMax !== undefined && usesCurrent !== undefined) {
      spent = Math.max(spent, usesMax - usesCurrent);
    }
    const { usesMax: _usesMax, usesCurrent: _usesCurrent, recharge: _recharge, ...rest } = feature;
    return { ...rest, resourceId: "channel-divinity" };
  });
  if (!changed) {
    return record;
  }

  const previous = isRecord(record.classResourcesUsed) ? record.classResourcesUsed : {};
  const classResourcesUsed =
    spent > 0 && previous["channel-divinity"] === undefined
      ? { ...previous, "channel-divinity": spent }
      : previous;
  return { ...record, features, classResourcesUsed };
}

/**
 * Convertit un personnage au format antérieur aux valeurs calculées (docs/adr/0022) vers le format
 * courant. Idempotent : un personnage déjà au format courant ressort inchangé. Travaille sur des
 * données brutes (avant validation Zod) pour servir à la fois à la migration du stockage local et
 * à l'import JSON (sauvegardes, fiches écrites à la main) — voir docs/adr/0023.
 */
export function normalizeLegacyCharacter(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }
  return withChannelDivinityResource(withSpellSlotsUsed(withClassId(raw)));
}
