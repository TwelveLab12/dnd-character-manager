import type { ActivityCategory, ActivityChange, ActivityValue } from "../activity-log";
import type { Character } from "../character";
import type { Coin } from "../currency";
import { COINS, characterCurrency } from "../currency";
import { weaponPlacement } from "../equipment";
import type { InventoryItem } from "../inventory";
import { computeClassResources } from "./class-resources";
import { deathSavesOf, dyingStatus } from "./death-saves";
import type { DyingStatus } from "./death-saves";
import { computeHitDice } from "./hit-dice";
import { computeSpellSlots } from "./spell-slot-table";

const COIN_ABBREVIATIONS: Record<Coin, string> = {
  platinum: "pp",
  gold: "po",
  electrum: "pe",
  silver: "pa",
  copper: "pc",
};

const STATUS_LABELS: Record<DyingStatus, string> = {
  alive: "Conscient",
  dying: "Mourant",
  stable: "Stabilisé",
  dead: "Mort",
};

const PLACEMENT_LABELS = {
  bag: "Sac",
  ready: "Prête",
  main: "En main",
  off: "Main secondaire",
  both: "Deux mains",
} as const;

export interface DescribeOptions {
  /** Nom d'un sort de la bibliothèque, pour la concentration et les sorts préparés. */
  spellName?: (spellId: string) => string | undefined;
}

/**
 * Valeurs de la fiche modifiées par une action du mode jeu (docs/adr/0061), libellées au moment de
 * l'action : PV, PV temporaires, dés de vie, état et jets contre la mort, concentration, rage,
 * effets de CA, emplacements de sorts, ressources de classe, capacités, sorts préparés, quantités,
 * emplacement des objets, bourse. Les réglages de la configuration ne sont pas suivis.
 */
export function describeChanges(
  before: Character,
  after: Character,
  { spellName = () => undefined }: DescribeOptions = {},
): ActivityChange[] {
  const changes: ActivityChange[] = [];
  function track(
    key: string,
    label: string,
    from: ActivityValue,
    to: ActivityValue,
    category: ActivityCategory,
  ) {
    if (from !== to) {
      changes.push({ key, label, from, to, category });
    }
  }

  track("hp", "PV", before.hitPoints.current, after.hitPoints.current, "hit-points");
  track(
    "hp-temp",
    "PV temporaires",
    before.hitPoints.temporary,
    after.hitPoints.temporary,
    "hit-points",
  );

  const hitDiceBefore = computeHitDice(before);
  const hitDiceAfter = computeHitDice(after);
  if (hitDiceBefore && hitDiceAfter) {
    track(
      "hit-dice",
      `Dés de vie (d${hitDiceAfter.die})`,
      hitDiceBefore.remaining,
      hitDiceAfter.remaining,
      "hit-points",
    );
  }

  track(
    "status",
    "État",
    STATUS_LABELS[dyingStatus(before)],
    STATUS_LABELS[dyingStatus(after)],
    "status",
  );
  track(
    "death-saves",
    "Jets contre la mort",
    formatDeathSaves(before),
    formatDeathSaves(after),
    "status",
  );

  const concentration = (character: Character) =>
    character.concentration.active
      ? ((character.concentration.spellId && spellName(character.concentration.spellId)) ?? "oui")
      : "non";
  track("concentration", "Concentration", concentration(before), concentration(after), "status");
  track("exhaustion", "Épuisement", before.exhaustion ?? 0, after.exhaustion ?? 0, "status");
  track("rage", "Rage", before.raging ? "oui" : "non", after.raging ? "oui" : "non", "status");
  const shillelagh = (character: Character) =>
    character.shillelagh
      ? (character.inventory.find((item) => item.id === character.shillelagh?.itemId)?.name ??
        "oui")
      : "non";
  track(
    "symbiotic-entity",
    "Entité symbiotique",
    before.symbioticEntity ? "oui" : "non",
    after.symbioticEntity ? "oui" : "non",
    "status",
  );
  track("shillelagh", "Gourdin magique", shillelagh(before), shillelagh(after), "status");
  for (const effect of after.armorClassEffects ?? []) {
    const previous = before.armorClassEffects?.find((candidate) => candidate.id === effect.id);
    if (previous?.trigger.type === "manual" && effect.trigger.type === "manual") {
      track(
        `ac-effect:${effect.id}`,
        `${effect.name} (CA +${effect.bonus})`,
        previous.trigger.active ? "actif" : "inactif",
        effect.trigger.active ? "actif" : "inactif",
        "status",
      );
    }
  }

  const slotsBefore = computeSpellSlots(before);
  for (const slot of computeSpellSlots(after)) {
    const previous = slotsBefore.find((candidate) => candidate.level === slot.level);
    if (previous) {
      track(
        `slot:${slot.level}`,
        `Emplacements niv. ${slot.level}`,
        previous.total - previous.used,
        slot.total - slot.used,
        "spells",
      );
    }
  }
  const preparedBefore = new Set(before.preparedSpellIds);
  const preparedAfter = new Set(after.preparedSpellIds);
  for (const spellId of new Set([...preparedBefore, ...preparedAfter])) {
    track(
      `prepared:${spellId}`,
      spellName(spellId) ?? "Sort",
      preparedBefore.has(spellId) ? "préparé" : "non préparé",
      preparedAfter.has(spellId) ? "préparé" : "non préparé",
      "spells",
    );
  }

  const resourcesBefore = computeClassResources(before);
  for (const resource of computeClassResources(after)) {
    const previous = resourcesBefore.find((candidate) => candidate.id === resource.id);
    if (previous) {
      track(
        `resource:${resource.id}`,
        resource.name,
        previous.remaining,
        resource.remaining,
        "resources",
      );
    }
  }
  for (const feature of after.features) {
    const previous = before.features.find((candidate) => candidate.id === feature.id);
    if (previous && feature.usesMax !== undefined) {
      track(
        `feature:${feature.id}`,
        feature.name,
        previous.usesCurrent ?? feature.usesMax,
        feature.usesCurrent ?? feature.usesMax,
        "resources",
      );
    }
  }

  for (const item of after.inventory) {
    const previous = before.inventory.find((candidate) => candidate.id === item.id);
    if (!previous) {
      continue;
    }
    const name = item.name || "Objet";
    track(
      `quantity:${item.id}`,
      `${name} (quantité)`,
      previous.quantity,
      item.quantity,
      "inventory",
    );
    track(
      `placement:${item.id}`,
      name,
      placementLabel(previous),
      placementLabel(item),
      "inventory",
    );
  }
  const currencyBefore = characterCurrency(before);
  const currencyAfter = characterCurrency(after);
  for (const coin of COINS) {
    track(
      `coin:${coin}`,
      COIN_ABBREVIATIONS[coin],
      currencyBefore[coin],
      currencyAfter[coin],
      "inventory",
    );
  }

  return changes;
}

function formatDeathSaves(character: Character): string {
  const { successes, failures } = deathSavesOf(character);
  return `${successes} ✓ · ${failures} ✗`;
}

function placementLabel(item: InventoryItem): string {
  if (item.weapon) {
    return PLACEMENT_LABELS[weaponPlacement(item)];
  }
  return item.equipped === true ? "Équipé" : "Non équipé";
}
