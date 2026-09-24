"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { findClassDefinition } from "@/domain/character-class";
import { spellBelongsToClass } from "@/domain/calculations/spell-preparation";
import type { Spell } from "@/domain/spell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

function levelLabel(level: number): string {
  return level === 0 ? "Tours de magie" : `Niveau ${level}`;
}

function spellsCount(count: number): string {
  return `${count} sort${count > 1 ? "s" : ""}`;
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Sélection de sorts connus depuis la bibliothèque (docs/adr/0032). Isolé du personnage : il ne
 * reçoit que la bibliothèque, les sorts déjà connus et la classe servant de filtre par défaut, et
 * remonte la sélection via `onAdd`.
 */
export function KnownSpellsPicker({
  library,
  knownSpellIds,
  classId,
  onAdd,
}: {
  library: readonly Spell[];
  knownSpellIds: readonly string[];
  classId?: string;
  onAdd: (spellIds: string[]) => void;
}) {
  const searchId = useId();
  const classFilterId = useId();
  const classDefinition = findClassDefinition(classId);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilters, setLevelFilters] = useState<number[]>([]);
  const [classOnly, setClassOnly] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  const levels = useMemo(
    () => [...new Set(library.map((spell) => spell.level))].sort((a, b) => a - b),
    [library],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("fr");
  const visibleSpells = library
    .filter(
      (spell) =>
        (!classOnly || !classDefinition || spellBelongsToClass(spell, classDefinition.id)) &&
        (levelFilters.length === 0 || levelFilters.includes(spell.level)) &&
        (normalizedQuery === "" || spell.name.toLocaleLowerCase("fr").includes(normalizedQuery)),
    )
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const groups = [...new Set(visibleSpells.map((spell) => spell.level))].map((level) => ({
    level,
    spells: visibleSpells.filter((spell) => spell.level === level),
  }));

  function reset() {
    setQuery("");
    setLevelFilters([]);
    setClassOnly(true);
    setSelected([]);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
    }
  }

  function add() {
    onAdd(selected);
    handleOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button">
          <Plus />
          Ajouter des sorts
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 sm:max-w-lg">
        <SheetHeader className="gap-4 border-b p-6">
          <div className="grid gap-1 pr-8">
            <SheetTitle className="font-heading text-xl">Ajouter des sorts connus</SheetTitle>
            <SheetDescription>
              Depuis votre bibliothèque · {spellsCount(library.length)}
            </SheetDescription>
          </div>

          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id={searchId}
              type="search"
              aria-label="Rechercher un sort"
              placeholder="Rechercher un sort…"
              className="h-10 pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {levels.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <Button
                  key={level}
                  type="button"
                  size="sm"
                  className="rounded-full"
                  variant={levelFilters.includes(level) ? "default" : "outline"}
                  aria-pressed={levelFilters.includes(level)}
                  onClick={() => setLevelFilters((current) => toggleInList(current, level))}
                >
                  {level === 0 ? "Tours" : `Niv. ${level}`}
                </Button>
              ))}
            </div>
          )}

          {classDefinition && (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={classFilterId} className="font-normal">
                Uniquement les sorts de {classDefinition.name}
              </Label>
              <Switch
                id={classFilterId}
                checked={classOnly}
                onCheckedChange={(checked) => setClassOnly(checked === true)}
              />
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {library.length === 0 && (
            <p className="text-muted-foreground px-6 py-4 text-sm">
              Votre bibliothèque est vide —{" "}
              <Link href="/spells" className="text-primary underline underline-offset-4">
                importez des sorts
              </Link>{" "}
              d&rsquo;abord.
            </p>
          )}

          {library.length > 0 && groups.length === 0 && (
            <p className="text-muted-foreground px-6 py-4 text-sm">
              Aucun sort ne correspond. Il en manque un ?{" "}
              <Link href="/spells" className="text-primary underline underline-offset-4">
                Importez-le dans la bibliothèque
              </Link>
              .
            </p>
          )}

          {groups.map((group) => (
            <section key={group.level} aria-label={levelLabel(group.level)}>
              <h3 className="font-heading text-primary px-6 pt-3 pb-1 text-base font-semibold">
                {levelLabel(group.level)}
              </h3>
              <ul>
                {group.spells.map((spell) => {
                  const known = knownSpellIds.includes(spell.id);
                  const checked = known || selected.includes(spell.id);
                  const details = [
                    spell.school,
                    spell.concentration ? "Concentration" : null,
                    spell.ritual ? "Rituel" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li key={spell.id}>
                      <label className="has-[[data-state=checked]:not(:disabled)]:bg-primary/10 flex min-h-14 cursor-pointer items-center gap-3 px-6 py-2 has-disabled:cursor-default has-disabled:opacity-60">
                        <Checkbox
                          checked={checked}
                          disabled={known}
                          onCheckedChange={() =>
                            setSelected((current) => toggleInList(current, spell.id))
                          }
                        />
                        <span className="grid flex-1 gap-0.5">
                          <span className="text-sm font-medium">{spell.name}</span>
                          <span className="text-muted-foreground text-xs">{details}</span>
                        </span>
                        {known && <Badge variant="secondary">Connu</Badge>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t p-4 px-6">
          <span className="text-muted-foreground text-sm">
            {selected.length === 0
              ? "Aucun sort sélectionné"
              : `${spellsCount(selected.length)} sélectionné${selected.length > 1 ? "s" : ""}`}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={selected.length === 0} onClick={add}>
              {selected.length === 0 ? "Ajouter" : `Ajouter ${spellsCount(selected.length)}`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
