"use client";

import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/domain/character";
import {
  isAlwaysAvailable,
  playAvailableSpellIds,
  spellDomain,
  spellDomainTags,
} from "@/domain/calculations/spell-availability";
import { computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import type { Spell } from "@/domain/spell";
import { formatModifier } from "@/features/shared/format";
import { Button } from "@/components/ui/button";
import { useSpellStore } from "@/stores/store-provider";
import { PrepareSpellsSheet } from "./prepare-spells-sheet";
import { SpellCastCard } from "./spell-cast-card";
import { SpellSlotsCard } from "./spell-slots-card";

type Filter =
  | { type: "level"; level: number }
  | { type: "concentration" }
  | { type: "ritual" }
  | { type: "domain"; domain: string };

function filterKey(filter: Filter): string {
  switch (filter.type) {
    case "level":
      return `level-${filter.level}`;
    case "domain":
      return `domain-${filter.domain}`;
    default:
      return filter.type;
  }
}

function levelLabel(level: number): string {
  return level === 0 ? "Tours de magie" : `Niveau ${level}`;
}

/**
 * Onglet Sorts du mode jeu (docs/adr/0034) : valeurs d'incantation et emplacements, filtres,
 * cartes de sorts à lancer (emplacement dépensé, concentration activée) et panneau de préparation
 * soumis à la limite de sorts préparés.
 */
export function SpellsViewTab({ character }: { character: Character }) {
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  const spellcasting = resolveSpellcasting(character);
  const slots = computeSpellSlots(character);

  const availableSpells = useMemo(() => {
    const ids = new Set(playAvailableSpellIds(character, spells));
    return spells
      .filter((spell) => ids.has(spell.id))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [character, spells]);

  const filters: { filter: Filter; label: string }[] = [
    ...[...new Set(availableSpells.map((spell) => spell.level))].map((level) => ({
      filter: { type: "level", level } as Filter,
      label: levelLabel(level),
    })),
    ...(availableSpells.some((spell) => spell.concentration)
      ? [{ filter: { type: "concentration" } as Filter, label: "Concentration" }]
      : []),
    ...(availableSpells.some((spell) => spell.ritual)
      ? [{ filter: { type: "ritual" } as Filter, label: "Rituel" }]
      : []),
    ...spellDomainTags(character, spells).map((domain) => ({
      filter: { type: "domain", domain } as Filter,
      label: domain,
    })),
  ];

  // Niveaux et domaines : « ou » au sein d'un même type ; concentration et rituel : « et ».
  const selected = filters.filter(({ filter }) => activeFilters.includes(filterKey(filter)));
  const selectedLevels = selected.flatMap(({ filter }) =>
    filter.type === "level" ? [filter.level] : [],
  );
  const selectedDomains = selected.flatMap(({ filter }) =>
    filter.type === "domain" ? [filter.domain] : [],
  );
  const onlyConcentration = selected.some(({ filter }) => filter.type === "concentration");
  const onlyRitual = selected.some(({ filter }) => filter.type === "ritual");

  const visibleSpells = availableSpells.filter((spell) => {
    const domain = spellDomain(character, spell.id, spells);
    return (
      (selectedLevels.length === 0 || selectedLevels.includes(spell.level)) &&
      (selectedDomains.length === 0 ||
        (domain !== undefined && selectedDomains.includes(domain))) &&
      (!onlyConcentration || spell.concentration) &&
      (!onlyRitual || spell.ritual)
    );
  });
  const groups = [...new Set(visibleSpells.map((spell) => spell.level))].map((level) => ({
    level,
    spells: visibleSpells.filter((spell) => spell.level === level),
  }));

  function slotsHint(level: number): string {
    if (level === 0) {
      return "à volonté";
    }
    const slot = slots.find((candidate) => candidate.level === level);
    if (!slot) {
      return "aucun emplacement de ce niveau";
    }
    const left = slot.total - slot.used;
    return `${left} emplacement${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}`;
  }

  return (
    <div className="grid gap-6">
      {spellcasting && (
        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="bg-card flex items-center justify-around gap-6 rounded-2xl border px-6 py-4 shadow-lg">
            <CastingValue label="DD" value={String(spellcasting.spellSaveDC)} />
            <CastingValue label="Attaque" value={formatModifier(spellcasting.spellAttackBonus)} />
          </div>
          <SpellSlotsCard character={character} />
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map(({ filter, label }) => {
            const key = filterKey(filter);
            const on = activeFilters.includes(key);
            return (
              <Button
                key={key}
                type="button"
                size="sm"
                className="rounded-full"
                variant={on ? "default" : "outline"}
                aria-pressed={on}
                onClick={() =>
                  setActiveFilters((current) =>
                    on ? current.filter((item) => item !== key) : [...current, key],
                  )
                }
              >
                {label}
              </Button>
            );
          })}
        </div>
        {spellcasting?.preparation === "prepared" && (
          <PrepareSpellsSheet character={character} library={spells} />
        )}
      </div>

      {availableSpells.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucun sort préparé ou toujours disponible pour l&rsquo;instant.
        </p>
      )}
      {availableSpells.length > 0 && visibleSpells.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun sort ne correspond aux filtres.</p>
      )}

      {groups.map((group) => (
        <section key={group.level} aria-label={levelLabel(group.level)} className="grid gap-3">
          <div className="flex items-baseline gap-2.5">
            <h3 className="font-heading text-primary text-xl font-semibold">
              {levelLabel(group.level)}
            </h3>
            <span className="text-muted-foreground text-sm">{slotsHint(group.level)}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {group.spells.map((spell: Spell) => (
              <SpellCastCard
                key={spell.id}
                character={character}
                spell={spell}
                domain={spellDomain(character, spell.id, spells)}
                alwaysPrepared={
                  spellcasting?.preparation === "prepared" &&
                  spell.level > 0 &&
                  isAlwaysAvailable(character, spell.id, spells)
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CastingValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span className="font-heading text-3xl leading-none font-semibold">{value}</span>
    </div>
  );
}
