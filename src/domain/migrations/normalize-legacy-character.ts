import type { AbilityScores } from "../ability-scores";
import { effectiveAbilityScores } from "../calculations/effective-ability-scores";
import { abilityModifier } from "../calculations/modifiers";
import {
  findClassDefinition,
  findClassDefinitionByLabel,
  findSubclassDefinitionByLabel,
} from "../character-class";
import type { RaceSelection } from "../race";
import { findRaceDefinition } from "../race";

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

/** Noms qui désignent la réserve elle-même (sa description), pas un effet qu'on déclenche. */
const CHANNEL_DIVINITY_POOL_NAMES: readonly string[] = ["canalisation divine", "channel divinity"];

type RawRecord = Record<string, unknown>;

function normalizeName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

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

/** `subclass` libre → `subclassId` connu de la classe, si absent et reconnaissable. */
function withSubclassId(record: RawRecord): RawRecord {
  if (typeof record.subclassId === "string" || typeof record.subclass !== "string") {
    return record;
  }
  const classId = typeof record.classId === "string" ? record.classId : undefined;
  const definition = findSubclassDefinitionByLabel(classId, record.subclass);
  return definition ? { ...record, subclassId: definition.id } : record;
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
 * Une capacité qui ne porte que le nom de la réserve (« Canalisation divine ») la décrit : elle
 * n'est pas liée, sinon le HUD la proposerait comme un effet à déclencher.
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
    const name = String(feature.name ?? "");
    const label = `${name} ${String(feature.source ?? "")}`;
    if (
      CHANNEL_DIVINITY_POOL_NAMES.includes(normalizeName(name)) ||
      !CHANNEL_DIVINITY_FEATURE_PATTERNS.some((pattern) => pattern.test(label))
    ) {
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

function raceSelectionOf(record: RawRecord): RaceSelection | undefined {
  const selection = record.raceSelection;
  return isRecord(selection) && typeof selection.raceId === "string"
    ? (selection as unknown as RaceSelection)
    : undefined;
}

/** Ancien `initiativeBonus` (total saisi) → `initiativeExtraBonus` (bonus hors Dextérité). */
function withInitiativeExtraBonus(record: RawRecord): RawRecord {
  if (!("initiativeBonus" in record)) {
    return record;
  }
  const { initiativeBonus, ...rest } = record;
  const total = asNumber(initiativeBonus);
  const scores = isRecord(record.abilityScores)
    ? (record.abilityScores as unknown as AbilityScores)
    : undefined;
  const dexterity = asNumber(scores?.dexterity);
  if (total === undefined || !scores || dexterity === undefined) {
    return rest;
  }
  const effectiveDexterity = effectiveAbilityScores(scores, raceSelectionOf(record)).dexterity;
  const extra = total - abilityModifier(effectiveDexterity);
  return extra !== 0 ? { ...rest, initiativeExtraBonus: extra } : rest;
}

/** Ancienne `speed` saisie → supprimée pour une race connue (vitesse calculée), sinon conservée
 * comme `baseSpeed`. */
function withBaseSpeed(record: RawRecord): RawRecord {
  if (!("speed" in record)) {
    return record;
  }
  const { speed, ...rest } = record;
  const raceSelection = raceSelectionOf(record);
  if (raceSelection && findRaceDefinition(raceSelection.raceId)) {
    return rest;
  }
  const value = asNumber(speed);
  return value !== undefined && rest.baseSpeed === undefined ? { ...rest, baseSpeed: value } : rest;
}

/** Les maîtrises de jets de sauvegarde accordées par la classe sont calculées : seules les
 * maîtrises supplémentaires restent stockées. */
function withoutClassSavingThrows(record: RawRecord): RawRecord {
  const classId = typeof record.classId === "string" ? record.classId : undefined;
  const granted = findClassDefinition(classId)?.savingThrows ?? [];
  if (granted.length === 0 || !Array.isArray(record.savingThrowProficiencies)) {
    return record;
  }
  const extras = record.savingThrowProficiencies.filter(
    (ability) => !granted.includes(ability as never),
  );
  return extras.length === record.savingThrowProficiencies.length
    ? record
    : { ...record, savingThrowProficiencies: extras };
}

/** Ancien `hitPoints.max` saisi → supprimé pour une classe connue (PV max calculés, valeur fixe par
 * défaut), sinon conservé comme `baseMaxHitPoints`. */
function withoutStoredMaxHitPoints(record: RawRecord): RawRecord {
  if (!isRecord(record.hitPoints) || !("max" in record.hitPoints)) {
    return record;
  }
  const { max, ...hitPoints } = record.hitPoints;
  const classId = typeof record.classId === "string" ? record.classId : undefined;
  const value = asNumber(max);
  const keepAsBase =
    findClassDefinition(classId) === undefined &&
    value !== undefined &&
    record.baseMaxHitPoints === undefined;
  return keepAsBase ? { ...record, hitPoints, baseMaxHitPoints: value } : { ...record, hitPoints };
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
  const normalized = withoutStoredMaxHitPoints(
    withoutClassSavingThrows(
      withBaseSpeed(withInitiativeExtraBonus(withSpellSlotsUsed(withSubclassId(withClassId(raw))))),
    ),
  );
  // Les ressources de classe n'existent pas au format d'origine : un personnage qui porte déjà
  // `classResourcesUsed` est au format courant, et ses liens capacité → ressource sont des choix
  // du joueur qu'on ne doit jamais réécrire (ex : une capacité volontairement non liée).
  return "classResourcesUsed" in raw ? normalized : withChannelDivinityResource(normalized);
}
