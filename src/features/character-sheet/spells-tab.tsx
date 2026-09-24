"use client";

import {
  CircleOff,
  Hourglass,
  Moon,
  MoonStar,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  countPreparedSpells,
  removeKnownSpell,
  setSpellDomain,
  setSpellPreparation,
  spellPreparationState,
} from "@/domain/calculations/spell-preparation";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import { findClassDefinition } from "@/domain/character-class";
import type { Spell } from "@/domain/spell";
import { useSpellStore } from "@/stores/store-provider";
import { ABILITY_LABELS, ABILITY_SHORT_LABELS } from "@/features/shared/ability-labels";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

/**
 * En-tête d'incantation : une tuile par valeur calculée, la formule en légende. Les surcharges
 * s'éditent dans un popover (crayon) ; une valeur forcée s'affiche en bleu avec le calcul à côté.
 */
function SpellcastingSection({ draft, onChange }: CharacterTabProps) {
  const abilityId = useId();
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

  const abilityShort = ABILITY_SHORT_LABELS[resolved.ability];
  const level = clampCharacterLevel(draft.level);
  const mod = formatModifier(resolved.abilityModifier);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionTitle>Incantation</SectionTitle>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {classDefinition ? `${classDefinition.name} niv. ${level} · ` : ""}maîtrise{" "}
            {formatModifier(resolved.proficiencyBonus)}
          </span>
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
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Caractéristique" detail={`mod. ${mod}`}>
          {classAbility && classDefinition ? (
            <span className="font-heading text-3xl font-semibold">
              {ABILITY_LABELS[classAbility]}
            </span>
          ) : (
            <Select
              value={resolved.ability}
              onValueChange={(value) => setOverride({ ability: value as AbilityName })}
            >
              <SelectTrigger id={abilityId} aria-label="Caractéristique d'incantation">
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
        </StatTile>

        <OverridableStatTile
          label="DD de sauvegarde"
          value={String(resolved.spellSaveDC)}
          formula={`8 + maîtrise ${resolved.proficiencyBonus} + ${abilityShort} ${resolved.abilityModifier}`}
          computed={String(resolved.computed.spellSaveDC)}
          override={overrides.spellSaveDCOverride}
          onOverride={(value) => setOverride({ spellSaveDCOverride: value })}
        />
        <OverridableStatTile
          label="Attaque de sort"
          value={formatModifier(resolved.spellAttackBonus)}
          formula={`maîtrise ${resolved.proficiencyBonus} + ${abilityShort} ${resolved.abilityModifier}`}
          computed={formatModifier(resolved.computed.spellAttackBonus)}
          override={overrides.spellAttackBonusOverride}
          onOverride={(value) => setOverride({ spellAttackBonusOverride: value })}
        />
        {resolved.preparation === "prepared" ? (
          <OverridableStatTile
            label="Sorts préparés"
            value={
              resolved.preparedSpellsMax === undefined ? "—" : String(resolved.preparedSpellsMax)
            }
            formula={
              resolved.computed.preparedSpellsMax === undefined
                ? "pas de limite calculée"
                : `${abilityShort} ${resolved.abilityModifier} + niveau ${level} (min. 1)`
            }
            computed={
              resolved.computed.preparedSpellsMax === undefined
                ? "aucun"
                : String(resolved.computed.preparedSpellsMax)
            }
            override={overrides.preparedSpellsMaxOverride}
            min={0}
            onOverride={(value) => setOverride({ preparedSpellsMaxOverride: value })}
          />
        ) : (
          <StatTile label="Sorts préparés" detail="tous les sorts connus sont utilisables">
            <span className="font-heading text-3xl font-semibold">Aucune</span>
          </StatTile>
        )}
      </div>
    </section>
  );
}

function StatTile({
  label,
  detail,
  forced = false,
  action,
  children,
}: {
  label: string;
  detail: string;
  forced?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-card relative flex flex-col items-center gap-1.5 rounded-xl border px-3 pt-5 pb-4 text-center shadow-lg"
    >
      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </span>
      <div className={forced ? "text-sky-400" : undefined}>{children}</div>
      <span className="text-muted-foreground text-xs">{detail}</span>
      {action && <div className="absolute top-1.5 right-1.5">{action}</div>}
    </div>
  );
}

function OverridableStatTile({
  label,
  value,
  formula,
  computed,
  override,
  min,
  onOverride,
}: {
  label: string;
  value: string;
  formula: string;
  computed: string;
  override: number | undefined;
  min?: number;
  onOverride: (value: number | undefined) => void;
}) {
  const inputId = useId();
  const forced = override !== undefined;

  return (
    <StatTile
      label={label}
      detail={forced ? `valeur forcée (calcul : ${computed})` : formula}
      forced={forced}
      action={
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={`Ajuster : ${label}`}
            >
              <Pencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <Label htmlFor={inputId}>{label} — valeur forcée</Label>
            <Input
              id={inputId}
              type="number"
              min={min}
              placeholder={`Automatique (${computed})`}
              value={override ?? ""}
              onChange={(event) =>
                onOverride(event.target.value ? toNumber(event.target.value) : undefined)
              }
            />
            {forced && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOverride(undefined)}>
                <RotateCcw />
                Revenir au calcul
              </Button>
            )}
          </PopoverContent>
        </Popover>
      }
    >
      <span className="font-heading text-4xl leading-none font-semibold">{value}</span>
    </StatTile>
  );
}

/**
 * Emplacements CALCULÉS depuis la classe et le niveau (docs/adr/0022) : un jeton par emplacement,
 * plein = disponible ; toucher un jeton le dépense (ou le rend s'il est déjà dépensé).
 */
function SpellSlotsSection({ draft, onChange }: CharacterTabProps) {
  const slots = computeSpellSlots(draft);

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-0.5">
          <SectionTitle>Emplacements de sorts</SectionTitle>
          {slots.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Calculés depuis la classe et le niveau · touchez un emplacement pour le dépenser
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

      {slots.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {slots.map((slot) => (
            <SpellSlotCard key={slot.level} slot={slot} draft={draft} onChange={onChange} />
          ))}
        </div>
      )}
    </section>
  );
}

function SpellSlotCard({ slot, draft, onChange }: CharacterTabProps & { slot: SpellSlotLevel }) {
  const available = slot.total - slot.used;

  return (
    <div className="bg-card grid gap-3 rounded-xl border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-primary text-base font-semibold">
          Niveau {slot.level}
        </span>
        <span className="text-muted-foreground text-xs">
          <strong className="text-foreground">{available}</strong> / {slot.total}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: slot.total }, (_, index) => {
          const spent = index >= available;
          return (
            <button
              key={index}
              type="button"
              aria-pressed={spent}
              aria-label={`Emplacement de niveau ${slot.level} ${index + 1} : ${spent ? "dépensé" : "disponible"}`}
              onClick={() =>
                onChange({
                  spellSlotsUsed: adjustSpellSlotsUsed(draft, slot.level, spent ? -1 : 1),
                })
              }
              className={
                spent
                  ? "border-muted-foreground/50 size-7 rounded-full border-2 border-dashed transition-colors"
                  : "border-primary bg-primary shadow-primary/50 size-7 rounded-full border-2 shadow-[0_0_10px] transition-colors"
              }
            />
          );
        })}
      </div>
    </div>
  );
}

const PREPARED_GRID = "sm:grid-cols-[minmax(0,1fr)_12rem_6rem_8.5rem_2.75rem]";
const KNOWN_GRID = "sm:grid-cols-[minmax(0,1fr)_12rem_2.75rem]";

function levelLabel(level: number): string {
  return level === 0 ? "Tours de magie" : `Niveau ${level}`;
}

/**
 * Liste unique des sorts connus (docs/adr/0032) : domaine, préparé / toujours préparé (exclusifs)
 * et retrait sur une même ligne. L'ajout passe par le sélecteur dédié, `KnownSpellsPicker`. La
 * limite de sorts préparés (docs/adr/0033) verrouille les autres switches « Préparé » une fois
 * atteinte ; un lanceur sans préparation (Barde, Ensorceleur) n'a pas ces colonnes.
 */
function KnownSpellsSection({ draft, onChange, spells }: CharacterTabProps & { spells: Spell[] }) {
  const [pendingSpellId, setPendingSpellId] = useState<string | undefined>();

  const resolved = resolveSpellcasting(draft);
  const preparesSpells = resolved?.preparation !== "known";
  const preparedMax = preparesSpells ? resolved?.preparedSpellsMax : undefined;
  const classDefinition = findClassDefinition(draft.classId);

  const knownSpells = spells
    .filter((spell) => draft.knownSpellIds.includes(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const levels = [...new Set(knownSpells.map((spell) => spell.level))];
  const preparedCount = countPreparedSpells(draft, spells);
  const alwaysCount = knownSpells.filter(
    (spell) => spell.level > 0 && spellPreparationState(draft, spell.id) === "always",
  ).length;
  const limitReached = preparedMax !== undefined && preparedCount >= preparedMax;
  const pendingSpell = knownSpells.find((spell) => spell.id === pendingSpellId);
  const grid = preparesSpells ? PREPARED_GRID : KNOWN_GRID;

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

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2">
          <SectionTitle>Sorts connus</SectionTitle>
          {preparesSpells ? (
            <>
              {preparedMax !== undefined && resolved && (
                <PreparationGauge
                  count={preparedCount}
                  max={preparedMax}
                  forced={draft.spellcasting?.preparedSpellsMaxOverride !== undefined}
                />
              )}
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                <span>
                  <strong className="text-foreground font-semibold">{knownSpells.length}</strong>{" "}
                  connus
                </span>
                {preparedMax === undefined && (
                  <span className="flex items-center gap-1.5">
                    <span className="bg-primary size-2 rounded-full" aria-hidden />
                    <strong className="text-foreground font-semibold">{preparedCount}</strong>{" "}
                    préparés
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-sky-400" aria-hidden />
                  <strong className="text-foreground font-semibold">{alwaysCount}</strong> toujours
                  préparés
                </span>
                <span>· les sorts toujours préparés et les tours de magie ne comptent pas</span>
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground font-semibold">{knownSpells.length}</strong> connus
              · {classDefinition?.name ?? "Ce lanceur"} ne prépare pas ses sorts : tous ses sorts
              connus sont utilisables en jeu.
            </p>
          )}
        </div>
        <KnownSpellsPicker
          library={spells}
          knownSpellIds={draft.knownSpellIds}
          classId={draft.classId}
          onAdd={(spellIds) => onChange(addKnownSpells(draft, spellIds))}
        />
      </div>

      {knownSpells.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Aucun sort connu — ajoutez-en depuis votre bibliothèque.
        </p>
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border shadow-lg">
          <div
            className={`text-muted-foreground hidden items-center gap-4 border-b px-4 py-2.5 text-xs font-semibold tracking-wider uppercase sm:grid ${grid}`}
          >
            <span>Sort</span>
            <span>Domaine</span>
            {preparesSpells && (
              <>
                <span className="text-center">Préparé</span>
                <span className="text-center">Toujours préparé</span>
              </>
            )}
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
                      grid={grid}
                      preparesSpells={preparesSpells}
                      limitReached={limitReached}
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

function PreparationGauge({ count, max, forced }: { count: number; max: number; forced: boolean }) {
  const over = count > max;
  const full = count >= max;
  const percent = max === 0 ? 100 : Math.min(100, (count / max) * 100);

  return (
    <div className="grid max-w-md gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span>Sorts préparés</span>
        <span
          className={`font-semibold ${over ? "text-destructive" : full ? "text-primary" : ""}`}
          aria-label={`${count} sorts préparés sur ${max}`}
        >
          {count} / {max}
          {forced && <span className="ml-1 text-xs font-normal text-sky-400">(forcé)</span>}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Sorts préparés"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={count}
        className="bg-muted h-2 overflow-hidden rounded-full"
      >
        <div
          className={`h-full rounded-full transition-[width] ${over ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {over && (
        <p className="text-destructive text-xs">
          Limite dépassée : retirez {count - max} sort{count - max > 1 ? "s" : ""} préparé
          {count - max > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}

function KnownSpellRow({
  spell,
  draft,
  onChange,
  grid,
  preparesSpells,
  limitReached,
  onTogglePrepared,
  onToggleAlways,
}: CharacterTabProps & {
  spell: Spell;
  grid: string;
  preparesSpells: boolean;
  limitReached: boolean;
  onTogglePrepared: (spellId: string, checked: boolean) => void;
  onToggleAlways: (checked: boolean) => void;
}) {
  const state = spellPreparationState(draft, spell.id);
  const domain = draft.spellTags.find((tag) => tag.spellId === spell.id)?.domain ?? "";
  const preparedLocked = limitReached && state !== "prepared";

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t px-4 py-2 sm:min-h-14 ${grid}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 text-sm font-medium break-words">{spell.name}</span>
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
      {preparesSpells &&
        (spell.level === 0 ? (
          <span className="text-muted-foreground col-span-2 flex items-center gap-1.5 text-xs sm:justify-center">
            <MoonStar className="size-3.5" aria-hidden />
            Toujours disponible
          </span>
        ) : (
          <>
            <Label
              className="text-muted-foreground flex items-center gap-2 text-xs sm:justify-center"
              title={preparedLocked ? "Limite de sorts préparés atteinte" : undefined}
            >
              <Switch
                checked={state === "prepared"}
                disabled={preparedLocked}
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
        ))}
    </li>
  );
}
