"use client";

import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/domain/character";
import { playAvailableSpellIds, spellDomainTags } from "@/domain/calculations/spell-availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/section-title";
import { useSpellStore } from "@/stores/store-provider";

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PreparedSpellsList({ character }: { character: Character }) {
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [domainFilters, setDomainFilters] = useState<string[]>([]);

  const availableIds = useMemo(() => new Set(playAvailableSpellIds(character)), [character]);
  const availableSpells = useMemo(
    () =>
      spells
        .filter((spell) => availableIds.has(spell.id))
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [spells, availableIds],
  );

  const levels = useMemo(
    () => [...new Set(availableSpells.map((spell) => spell.level))].sort((a, b) => a - b),
    [availableSpells],
  );
  const domains = spellDomainTags(character);

  function domainForSpell(spellId: string): string | undefined {
    return character.spellTags.find((tag) => tag.spellId === spellId)?.domain;
  }

  const filteredSpells = availableSpells.filter((spell) => {
    const matchesLevel = levelFilters.length === 0 || levelFilters.includes(spell.level);
    const spellDomain = domainForSpell(spell.id);
    const matchesDomain =
      domainFilters.length === 0 ||
      (spellDomain !== undefined && domainFilters.includes(spellDomain));
    return matchesLevel && matchesDomain;
  });

  return (
    <section className="grid gap-3">
      <SectionTitle>Sorts disponibles</SectionTitle>

      {(levels.length > 0 || domains.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <Button
              key={level}
              type="button"
              size="sm"
              variant={levelFilters.includes(level) ? "default" : "outline"}
              aria-pressed={levelFilters.includes(level)}
              onClick={() => setLevelFilters((current) => toggleInList(current, level))}
            >
              {level === 0 ? "Tour de magie" : `Niveau ${level}`}
            </Button>
          ))}
          {domains.map((domain) => (
            <Button
              key={domain}
              type="button"
              size="sm"
              variant={domainFilters.includes(domain) ? "default" : "outline"}
              aria-pressed={domainFilters.includes(domain)}
              onClick={() => setDomainFilters((current) => toggleInList(current, domain))}
            >
              {domain}
            </Button>
          ))}
        </div>
      )}

      {availableSpells.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucun sort préparé ou toujours disponible pour l&rsquo;instant.
        </p>
      )}

      {availableSpells.length > 0 && filteredSpells.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun sort ne correspond aux filtres.</p>
      )}

      {filteredSpells.length > 0 && (
        <ul className="grid gap-2">
          {filteredSpells.map((spell) => {
            const domain = domainForSpell(spell.id);
            return (
              <li
                key={spell.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm"
              >
                <span className="font-medium">{spell.name}</span>
                <Badge variant="outline">
                  {spell.level === 0 ? "Tour de magie" : `Niv. ${spell.level}`}
                </Badge>
                {domain && <Badge variant="secondary">{domain}</Badge>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
