"use client";

import { CircleOff, Hourglass, Moon, MoonStar, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { SpellcastingInfo, SpellSlotLevel } from "@/domain/character";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import { applyLongRest, applyShortRest } from "@/domain/calculations/rest";
import { adjustSpellSlotsUsed, computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import type { SpellPreparationState } from "@/domain/calculations/spell-preparation";
import {
  addKnownSpells,
  removeKnownSpell,
  setSpellDomain,
  setSpellPreparation,
  spellPreparationState,
} from "@/domain/calculations/spell-preparation";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import { findClassDefinition } from "@/domain/character-class";
import type { Spell } from "@/domain/spell";
import { useSpellStore } from "@/stores/store-provider";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { KnownSpellsPicker } from "./known-spells-picker";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SpellsTab({ draft, onChange }: CharacterTabProps) {
  const spells = useSpellStore((state) => state.spells);
  const loadSpells = useSpellStore((state) => state.load);

  useEffect(() => {
    void loadSpells();
  }, [loadSpells]);

  return (
    <div className="grid gap-8">
      <SpellcastingSection draft={draft} onChange={onChange} />
      <SpellSlotsSection draft={draft} onChange={onChange} />
      <KnownSpellsSection draft={draft} onChange={onChange} spells={spells} />
    </div>
  );
}

function SpellcastingSection({ draft, onChange }: CharacterTabProps) {
  const abilityId = useId();
  const dcOverrideId = useId();
  const attackOverrideId = useId();
  const classDefinition = findClassDefinition(draft.classId);
  const classAbility = classDefinition?.spellcasting?.ability;
  const resolved = resolveSpellcasting(draft);
  const overrides = draft.spellcasting ?? {};

  if (!resolved) {
    return (
      <section className="grid gap-2">
        <SectionTitle>Incantation</SectionTitle>
        <p className="text-muted-foreground text-sm">
          Ce personnage n&rsquo;a pas de caractéristique d&rsquo;incantation définie.
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ spellcasting: { ...overrides, ability: "wisdom" } })}
          >
            <Sparkles />
            Activer l&rsquo;incantation
          </Button>
        </div>
      </section>
    );
  }

  function setOverride(patch: Partial<SpellcastingInfo>) {
    onChange({ spellcasting: { ...overrides, ...patch } });
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Incantation</SectionTitle>
        {!classAbility && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ spellcasting: undefined })}
          >
            <CircleOff />
            Désactiver
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={abilityId}>Caractéristique</Label>
          {classAbility && classDefinition ? (
            <p id={abilityId} className="text-sm">
              {ABILITY_LABELS[classAbility]}{" "}
              <span className="text-muted-foreground text-xs">
                (déterminée par la classe {classDefinition.name})
              </span>
            </p>
          ) : (
            <Select
              value={resolved.ability}
              onValueChange={(value) => setOverride({ ability: value as AbilityName })}
            >
              <SelectTrigger id={abilityId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ABILITY_NAMES.map((ability) => (
                  <SelectItem key={ability} value={ability}>
                    {ABILITY_LABELS[ability]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={dcOverrideId} className="font-semibold">
            DD de sauvegarde — {resolved.spellSaveDC}
          </Label>
          <Input
            id={dcOverrideId}
            type="number"
            placeholder="Calcul automatique"
            value={overrides.spellSaveDCOverride ?? ""}
            onChange={(event) =>
              setOverride({
                spellSaveDCOverride: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={attackOverrideId} className="font-semibold">
            Bonus d&rsquo;attaque — {formatModifier(resolved.spellAttackBonus)}
          </Label>
          <Input
            id={attackOverrideId}
            type="number"
            placeholder="Calcul automatique"
            value={overrides.spellAttackBonusOverride ?? ""}
            onChange={(event) =>
              setOverride({
                spellAttackBonusOverride: event.target.value
                  ? toNumber(event.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Emplacements CALCULÉS depuis la classe et le niveau (docs/adr/0022) : seuls les emplacements
 * utilisés sont modifiables ici.
 */
function SpellSlotsSection({ draft, onChange }: CharacterTabProps) {
  const classDefinition = findClassDefinition(draft.classId);
  const slots = computeSpellSlots(draft);

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-0.5">
          <SectionTitle>Emplacements de sorts</SectionTitle>
          {slots.length > 0 && classDefinition && (
            <p className="text-muted-foreground text-xs">
              Calculés : {classDefinition.name} niv. {clampCharacterLevel(draft.level)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(applyShortRest(draft))}
          >
            <Hourglass />
            Repos court
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(applyLongRest(draft))}
          >
            <Moon />
            Repos long
          </Button>
        </div>
      </div>

      {slots.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucun emplacement : choisis une classe de lanceur de sorts dans l&rsquo;onglet Général.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot) => (
          <SpellSlotUsedField key={slot.level} slot={slot} draft={draft} onChange={onChange} />
        ))}
      </div>
    </section>
  );
}

function SpellSlotUsedField({
  slot,
  draft,
  onChange,
}: CharacterTabProps & { slot: SpellSlotLevel }) {
  const usedId = useId();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
      <span className="w-20 text-sm font-medium">Niveau {slot.level}</span>
      <Label htmlFor={usedId} className="text-muted-foreground text-xs">
        Utilisés
      </Label>
      <Input
        id={usedId}
        type="number"
        className="w-16"
        min={0}
        max={slot.total}
        value={slot.used}
        onChange={(event) =>
          onChange({
            spellSlotsUsed: adjustSpellSlotsUsed(
              draft,
              slot.level,
              toNumber(event.target.value) - slot.used,
            ),
          })
        }
      />
      <span className="text-muted-foreground text-sm">/ {slot.total}</span>
    </div>
  );
}

const LEVEL_GRID = "sm:grid-cols-[minmax(0,1fr)_14rem_6rem_8.5rem_2.75rem]";

function levelLabel(level: number): string {
  return level === 0 ? "Tours de magie" : `Niveau ${level}`;
}

/**
 * Liste unique des sorts connus (docs/adr/0032) : domaine, préparé / toujours préparé (exclusifs)
 * et retrait sur une même ligne. L'ajout passe par le sélecteur dédié, `KnownSpellsPicker`.
 */
function KnownSpellsSection({ draft, onChange, spells }: CharacterTabProps & { spells: Spell[] }) {
  const [pendingSpellId, setPendingSpellId] = useState<string | undefined>();

  const knownSpells = spells
    .filter((spell) => draft.knownSpellIds.includes(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const levels = [...new Set(knownSpells.map((spell) => spell.level))];
  const leveledSpells = knownSpells.filter((spell) => spell.level > 0);
  const preparedCount = leveledSpells.filter(
    (spell) => spellPreparationState(draft, spell.id) === "prepared",
  ).length;
  const alwaysCount = leveledSpells.filter(
    (spell) => spellPreparationState(draft, spell.id) === "always",
  ).length;
  const pendingSpell = knownSpells.find((spell) => spell.id === pendingSpellId);

  function setPreparation(spellId: string, state: SpellPreparationState) {
    onChange(setSpellPreparation(draft, spellId, state));
  }

  function togglePrepared(spellId: string, checked: boolean) {
    if (checked && spellPreparationState(draft, spellId) === "always") {
      setPendingSpellId(spellId);
      return;
    }
    setPreparation(spellId, checked ? "prepared" : "none");
  }

  const picker = (
    <KnownSpellsPicker
      library={spells}
      knownSpellIds={draft.knownSpellIds}
      classId={draft.classId}
      onAdd={(spellIds) => onChange(addKnownSpells(draft, spellIds))}
    />
  );

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <SectionTitle>Sorts connus</SectionTitle>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-sm">
            <span>
              <strong className="text-foreground font-semibold">{knownSpells.length}</strong> connus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-primary size-2 rounded-full" aria-hidden />
              <strong className="text-foreground font-semibold">{preparedCount}</strong> préparés
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-400" aria-hidden />
              <strong className="text-foreground font-semibold">{alwaysCount}</strong> toujours
              préparés
            </span>
          </p>
        </div>
        {picker}
      </div>

      {knownSpells.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aucun sort connu — ajoutez-en depuis votre bibliothèque.
        </p>
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border shadow-lg">
          <div
            className={`text-muted-foreground hidden items-center gap-4 border-b px-4 py-2.5 text-xs font-semibold tracking-wider uppercase sm:grid ${LEVEL_GRID}`}
          >
            <span>Sort</span>
            <span>Domaine</span>
            <span className="text-center">Préparé</span>
            <span className="text-center">Toujours préparé</span>
            <span />
          </div>
          {levels.map((level) => {
            const levelSpells = knownSpells.filter((spell) => spell.level === level);
            return (
              <section key={level} aria-label={levelLabel(level)}>
                <h3 className="bg-background/40 flex items-baseline gap-2 px-4 pt-3 pb-1.5">
                  <span className="font-heading text-primary text-base font-semibold">
                    {levelLabel(level)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {levelSpells.length} sort{levelSpells.length > 1 ? "s" : ""}
                  </span>
                </h3>
                <ul>
                  {levelSpells.map((spell) => (
                    <KnownSpellRow
                      key={spell.id}
                      spell={spell}
                      draft={draft}
                      onChange={onChange}
                      onTogglePrepared={togglePrepared}
                      onToggleAlways={(checked) =>
                        setPreparation(spell.id, checked ? "always" : "none")
                      }
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={pendingSpell !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSpellId(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Passer en simple préparé ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {pendingSpell?.name} » est toujours préparé. Le passer en préparé lui retire ce
              statut : il comptera dans vos sorts préparés du jour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSpell) {
                  setPreparation(pendingSpell.id, "prepared");
                }
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function KnownSpellRow({
  spell,
  draft,
  onChange,
  onTogglePrepared,
  onToggleAlways,
}: CharacterTabProps & {
  spell: Spell;
  onTogglePrepared: (spellId: string, checked: boolean) => void;
  onToggleAlways: (checked: boolean) => void;
}) {
  const state = spellPreparationState(draft, spell.id);
  const domain = draft.spellTags.find((tag) => tag.spellId === spell.id)?.domain ?? "";

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t px-4 py-2 sm:min-h-14 ${LEVEL_GRID}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{spell.name}</span>
        {spell.concentration && (
          <Badge variant="outline" title="Concentration" className="px-1.5">
            C
          </Badge>
        )}
        {spell.ritual && (
          <Badge variant="outline" title="Rituel" className="px-1.5">
            R
          </Badge>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive sm:order-last"
        aria-label={`Retirer ${spell.name} des sorts connus`}
        onClick={() => onChange(removeKnownSpell(draft, spell.id))}
      >
        <Trash2 />
      </Button>
      <Input
        aria-label={`Domaine de ${spell.name}`}
        placeholder="Domaine…"
        className="col-span-2 h-9 sm:col-span-1"
        value={domain}
        onChange={(event) => onChange(setSpellDomain(draft, spell.id, event.target.value))}
      />
      {spell.level === 0 ? (
        <span className="text-muted-foreground col-span-2 flex items-center gap-1.5 text-xs sm:justify-center">
          <MoonStar className="size-3.5" aria-hidden />
          Toujours disponible
        </span>
      ) : (
        <>
          <Label className="text-muted-foreground flex items-center gap-2 text-xs sm:justify-center">
            <Switch
              checked={state === "prepared"}
              aria-label={`Préparé : ${spell.name}`}
              onCheckedChange={(checked) => onTogglePrepared(spell.id, checked === true)}
            />
            <span className="sm:sr-only">Préparé</span>
          </Label>
          <Label className="text-muted-foreground flex items-center gap-2 text-xs sm:justify-center">
            <Switch
              checked={state === "always"}
              aria-label={`Toujours préparé : ${spell.name}`}
              className="data-checked:bg-sky-400"
              onCheckedChange={(checked) => onToggleAlways(checked === true)}
            />
            <span className="sm:sr-only">Toujours préparé</span>
          </Label>
        </>
      )}
    </li>
  );
}
