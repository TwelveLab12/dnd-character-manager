"use client";

import { NotebookPen } from "lucide-react";
import type { Character } from "@/domain/character";
import { findClassDefinition } from "@/domain/character-class";
import {
  countPreparedSpells,
  spellPreparationState,
} from "@/domain/calculations/spell-preparation";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import type { Spell } from "@/domain/spell";
import { ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ConcentrationTag, RitualTag } from "./spell-cast-card";
import { usePlayActions } from "./use-play-actions";

/**
 * Préparation des sorts depuis le mode jeu (docs/adr/0034) : parmi les sorts connus de niveau 1+,
 * avec la même limite que la configuration (docs/adr/0033). Les sorts toujours préparés sont
 * affichés sans switch et ne comptent pas.
 */
export function PrepareSpellsSheet({
  character,
  library,
}: {
  character: Character;
  library: readonly Spell[];
}) {
  const { setSpellPreparation } = usePlayActions(character.id);
  const spellcasting = resolveSpellcasting(character);
  const max = spellcasting?.preparedSpellsMax;
  const count = countPreparedSpells(character, library);
  const full = max !== undefined && count >= max;
  const over = max !== undefined && count > max;

  const knownSpells = library
    .filter((spell) => spell.level > 0 && character.knownSpellIds.includes(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const levels = [...new Set(knownSpells.map((spell) => spell.level))];

  const classDefinition = findClassDefinition(character.classId);
  const formula =
    spellcasting && classDefinition
      ? `${ABILITY_SHORT_LABELS[spellcasting.ability]} ${formatModifier(spellcasting.abilityModifier)} + niveau ${clampCharacterLevel(character.level)}`
      : undefined;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="border-primary bg-primary/10">
          <NotebookPen className="text-primary" />
          Préparer les sorts
          <Badge
            variant={full ? "default" : "secondary"}
            className="tabular-nums"
            aria-label={max === undefined ? `${count} préparés` : `${count} préparés sur ${max}`}
          >
            {max === undefined ? count : `${count}/${max}`}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-0 sm:max-w-md">
        <SheetHeader className="gap-3 border-b p-6">
          <div className="grid gap-1 pr-8">
            <SheetTitle className="font-heading text-xl">Sorts préparés</SheetTitle>
            <SheetDescription>
              Parmi vos sorts connus{formula ? ` · ${formula}` : ""}
            </SheetDescription>
          </div>
          {max !== undefined && (
            <div className="grid gap-1.5">
              <div className="flex justify-between text-sm">
                <span>Préparés</span>
                <span
                  className={`font-semibold tabular-nums ${over ? "text-destructive" : full ? "text-primary" : ""}`}
                >
                  {count} / {max}
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${max === 0 ? 100 : Math.min(100, (count / max) * 100)}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {over
                  ? `Limite dépassée : retirez ${count - max} sort${count - max > 1 ? "s" : ""}.`
                  : full
                    ? "Limite atteinte : retirez un sort pour en préparer un autre."
                    : `Encore ${max - count} sort${max - count > 1 ? "s" : ""} à préparer.`}
              </p>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {knownSpells.length === 0 && (
            <p className="text-muted-foreground px-6 py-4 text-sm">
              Aucun sort connu de niveau 1 ou plus : ajoutez-en depuis la configuration.
            </p>
          )}
          {levels.map((level) => (
            <section key={level} aria-label={`Niveau ${level}`}>
              <h3 className="font-heading text-primary px-6 pt-3 pb-1 text-base font-semibold">
                Niveau {level}
              </h3>
              <ul>
                {knownSpells
                  .filter((spell) => spell.level === level)
                  .map((spell) => {
                    const state = spellPreparationState(character, spell.id);
                    const locked = full && state !== "prepared";
                    return (
                      <li key={spell.id} className="flex min-h-12 items-center gap-3 px-6 py-1.5">
                        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-sm font-medium">
                          <span className="break-words">{spell.name}</span>
                          {spell.concentration && <ConcentrationTag />}
                          {spell.ritual && <RitualTag />}
                        </span>
                        {state === "always" ? (
                          <Badge className="bg-info/15 text-info border-transparent">
                            Toujours préparé
                          </Badge>
                        ) : (
                          <Label title={locked ? "Limite de sorts préparés atteinte" : undefined}>
                            <Switch
                              checked={state === "prepared"}
                              disabled={locked}
                              aria-label={`Préparer ${spell.name}`}
                              onCheckedChange={(checked) =>
                                void setSpellPreparation(spell.id, checked ? "prepared" : "none")
                              }
                            />
                          </Label>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>

        <SheetFooter className="text-muted-foreground border-t px-6 text-xs">
          Les tours de magie et les sorts toujours préparés ne comptent pas. Ajouter un sort connu
          se fait depuis la configuration.
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
