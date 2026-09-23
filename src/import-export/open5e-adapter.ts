import type { Spell } from "@/domain/spell";

/**
 * Champs exploités de la réponse open5e v1 (api.open5e.com/v1/spells/…) — structure vérifiée en
 * direct contre l'API le 2026-09-23 (ex : GET /v1/spells/fireball/). Cf.
 * docs/adr/0004-json-import-export-open5e-schema.md. À revérifier si open5e change de version —
 * ce type ne couvre que les champs dont l'adapter a besoin, pas la réponse complète.
 */
export interface Open5eV1Spell {
  slug: string;
  name: string;
  desc: string;
  higher_level?: string;
  range: string;
  requires_verbal_components: boolean;
  requires_somatic_components: boolean;
  requires_material_components: boolean;
  material?: string;
  can_be_cast_as_ritual: boolean;
  duration: string;
  requires_concentration: boolean;
  casting_time: string;
  level_int: number;
  school: string;
  dnd_class?: string;
  document__title?: string;
}

/**
 * Champs exploités de la réponse open5e v2 (api.open5e.com/v2/spells/…) — structure vérifiée en
 * direct contre l'API le 2026-09-23 (ex : GET /v2/spells/srd_fireball/).
 */
export interface Open5eV2Spell {
  key: string;
  name: string;
  desc: string;
  higher_level?: string;
  school: { name: string };
  classes: { name: string }[];
  level: number;
  range_text: string;
  ritual: boolean;
  casting_time: string;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  material_specified?: string;
  duration: string;
  concentration: boolean;
  document?: { name: string };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value : undefined;
}

export function mapOpen5eV1Spell(raw: Open5eV1Spell): Spell {
  return {
    id: raw.slug,
    name: raw.name,
    level: raw.level_int,
    school: capitalize(raw.school),
    castingTime: raw.casting_time,
    range: raw.range,
    components: {
      verbal: raw.requires_verbal_components,
      somatic: raw.requires_somatic_components,
      material: raw.requires_material_components,
      materialDescription: nonEmpty(raw.material),
    },
    duration: capitalize(raw.duration),
    concentration: raw.requires_concentration,
    ritual: raw.can_be_cast_as_ritual,
    description: raw.desc,
    higherLevel: nonEmpty(raw.higher_level),
    classes: raw.dnd_class ? raw.dnd_class.split(",").map((name) => name.trim()) : [],
    source: raw.document__title,
  };
}

// open5e v2 normalise le temps d'incantation en slug court ("action", "bonus_action"…) plutôt
// qu'en texte affichable — cette table couvre les valeurs usuelles, avec un repli générique pour
// toute valeur non répertoriée (ex : "long_rest" -> "Long rest").
const OPEN5E_V2_CASTING_TIME_LABELS: Record<string, string> = {
  action: "1 action",
  bonus_action: "1 bonus action",
  reaction: "1 reaction",
  minute: "1 minute",
  hour: "1 hour",
};

function formatOpen5eV2CastingTime(value: string): string {
  return OPEN5E_V2_CASTING_TIME_LABELS[value] ?? capitalize(value.replace(/_/g, " "));
}

export function mapOpen5eV2Spell(raw: Open5eV2Spell): Spell {
  return {
    id: raw.key,
    name: raw.name,
    level: raw.level,
    school: capitalize(raw.school.name),
    castingTime: formatOpen5eV2CastingTime(raw.casting_time),
    range: raw.range_text,
    components: {
      verbal: raw.verbal,
      somatic: raw.somatic,
      material: raw.material,
      materialDescription: nonEmpty(raw.material_specified),
    },
    duration: capitalize(raw.duration),
    concentration: raw.concentration,
    ritual: raw.ritual,
    description: raw.desc,
    higherLevel: nonEmpty(raw.higher_level),
    classes: raw.classes.map((entry) => entry.name),
    source: raw.document?.name,
  };
}

/** Détecte la version open5e (v1 vs v2) à partir de champs caractéristiques et route vers le bon
 * mapper. Utilisé par scripts/convert-open5e-spells.ts pour accepter un export brut de l'une ou
 * l'autre version sans que l'appelant ait à le préciser. */
export function mapOpen5eSpell(raw: unknown): Spell {
  if (raw && typeof raw === "object") {
    if ("level_int" in raw && "slug" in raw) {
      return mapOpen5eV1Spell(raw as Open5eV1Spell);
    }
    if ("key" in raw && "school" in raw) {
      return mapOpen5eV2Spell(raw as Open5eV2Spell);
    }
  }
  throw new Error("Format open5e non reconnu (ni v1 ni v2)");
}
