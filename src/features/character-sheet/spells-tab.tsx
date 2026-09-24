"use client";

import { CircleOff, Hourglass, Moon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useId } from "react";
import type { AbilityName } from "@/domain/ability-scores";
import { ABILITY_NAMES } from "@/domain/ability-scores";
import type { SpellcastingInfo, SpellSlotLevel } from "@/domain/character";
import { clampCharacterLevel } from "@/domain/calculations/proficiency";
import { applyLongRest, applyShortRest } from "@/domain/calculations/rest";
import { adjustSpellSlotsUsed, computeSpellSlots } from "@/domain/calculations/spell-slot-table";
import { resolveSpellcasting } from "@/domain/calculations/spellcasting";
import { findClassDefinition } from "@/domain/character-class";
import type { Spell } from "@/domain/spell";
import type { CharacterSpellTag } from "@/domain/spell-tag";
import { useSpellStore } from "@/stores/store-provider";
import { ABILITY_LABELS } from "@/features/shared/ability-labels";
import { formatModifier } from "@/features/shared/format";
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
      <SpellTagsSection draft={draft} onChange={onChange} spells={spells} />
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

function KnownSpellsSection({ draft, onChange, spells }: CharacterTabProps & { spells: Spell[] }) {
  function toggleKnown(spellId: string, known: boolean) {
    onChange({
      knownSpellIds: known
        ? [...draft.knownSpellIds, spellId]
        : draft.knownSpellIds.filter((id) => id !== spellId),
      // Un sort qu'on ne connaît plus ne peut pas rester préparé ni tagué.
      preparedSpellIds: known
        ? draft.preparedSpellIds
        : draft.preparedSpellIds.filter((id) => id !== spellId),
      spellTags: known ? draft.spellTags : draft.spellTags.filter((tag) => tag.spellId !== spellId),
    });
  }

  function togglePrepared(spellId: string, prepared: boolean) {
    onChange({
      preparedSpellIds: prepared
        ? [...draft.preparedSpellIds, spellId]
        : draft.preparedSpellIds.filter((id) => id !== spellId),
    });
  }

  const sortedSpells = [...spells].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>Sorts connus / préparés</SectionTitle>
        <span className="text-muted-foreground text-sm">
          {draft.knownSpellIds.length} connu(s), {draft.preparedSpellIds.length} préparé(s)
        </span>
      </div>

      {spells.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucun sort dans la bibliothèque —{" "}
          <Link href="/spells" className="text-primary underline underline-offset-4">
            importez-en d&rsquo;abord
          </Link>
          .
        </p>
      )}

      {sortedSpells.length > 0 && (
        <div className="max-h-96 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="p-2 font-medium">Sort</th>
                <th className="p-2 font-medium">Niv.</th>
                <th className="p-2 font-medium">Connu</th>
                <th className="p-2 font-medium">Préparé</th>
              </tr>
            </thead>
            <tbody>
              {sortedSpells.map((spell) => {
                const known = draft.knownSpellIds.includes(spell.id);
                const prepared = draft.preparedSpellIds.includes(spell.id);
                return (
                  <tr key={spell.id} className="border-t">
                    <td className="p-2">{spell.name}</td>
                    <td className="p-2">{spell.level === 0 ? "T" : spell.level}</td>
                    <td className="p-2">
                      <Switch
                        checked={known}
                        onCheckedChange={(checked) => toggleKnown(spell.id, checked === true)}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={prepared}
                        disabled={!known}
                        onCheckedChange={(checked) => togglePrepared(spell.id, checked === true)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SpellTagsSection({ draft, onChange, spells }: CharacterTabProps & { spells: Spell[] }) {
  function tagFor(spellId: string): CharacterSpellTag {
    return (
      draft.spellTags.find((tag) => tag.spellId === spellId) ?? { spellId, alwaysPrepared: false }
    );
  }

  function updateTag(spellId: string, patch: Partial<CharacterSpellTag>) {
    const next = { ...tagFor(spellId), ...patch };
    const withoutSpell = draft.spellTags.filter((tag) => tag.spellId !== spellId);
    const isEmpty = !next.domain && !next.alwaysPrepared;
    onChange({ spellTags: isEmpty ? withoutSpell : [...withoutSpell, next] });
  }

  const knownSpells = spells
    .filter((spell) => draft.knownSpellIds.includes(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return (
    <section className="grid gap-3">
      <div>
        <SectionTitle>Domaines de sorts</SectionTitle>
        <p className="text-muted-foreground text-sm">
          Associez un domaine à un sort connu et marquez-le « toujours préparé » pour qu&rsquo;il
          apparaisse en mode jeu sans consommer de préparation (ex : sorts de domaine d&rsquo;un
          Clerc).
        </p>
      </div>

      {knownSpells.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucun sort connu pour l&rsquo;instant.</p>
      )}

      {knownSpells.length > 0 && (
        <div className="grid gap-2">
          {knownSpells.map((spell) => {
            const tag = tagFor(spell.id);
            return (
              <div
                key={spell.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border p-2"
              >
                <span className="min-w-32 flex-1 text-sm">{spell.name}</span>
                <Input
                  className="w-48"
                  placeholder="Domaine (ex : Domaine de la Lune)"
                  value={tag.domain ?? ""}
                  onChange={(event) =>
                    updateTag(spell.id, { domain: event.target.value || undefined })
                  }
                />
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Switch
                    checked={tag.alwaysPrepared}
                    onCheckedChange={(checked) =>
                      updateTag(spell.id, { alwaysPrepared: checked === true })
                    }
                  />
                  Toujours préparé
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
