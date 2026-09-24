"use client";

import { useId } from "react";
import { cn } from "cn";
import type { StatPart } from "@/domain/calculations/combat-stats";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { computeInitiative, computeSpeed } from "@/domain/calculations/combat-stats";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { martialArtsDie } from "@/domain/calculations/weapon-attack";
import { FEATS } from "@/domain/feat";
import { findRaceDefinition } from "@/domain/race";
import {
  CHARACTER_THEMES,
  DEFAULT_THEME_SWATCHES,
} from "@/features/character-theme/theme-registry";
import { formatArmorClassBreakdown } from "@/features/shared/armor-class";
import { formatModifier } from "@/features/shared/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArmorClassSection } from "./armor-class-section";
import { AttacksSection } from "./attacks-section";
import { GeneralSection, RuleSwitchRow } from "./general-section";
import { HitPointsSection } from "./hit-points-section";
import { IdentitySection } from "./identity-section";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Onglet Général de la configuration (docs/adr/0035) : identité, résumé des valeurs calculées,
 * puis une section par réglage (PV max, défense, attaques, dons et bonus, thème et notes).
 */
export function GeneralTab({ draft, onChange }: CharacterTabProps) {
  return (
    <div className="grid gap-7 pt-2">
      <IdentitySection draft={draft} onChange={onChange} />
      <SummaryTiles draft={draft} />
      <HitPointsSection draft={draft} onChange={onChange} />
      <ArmorClassSection draft={draft} onChange={onChange} />
      <AttacksSection draft={draft} onChange={onChange} />
      <RulesSection draft={draft} onChange={onChange} />
      <ThemeAndNotesSection draft={draft} onChange={onChange} />
    </div>
  );
}

function formatBreakdown(parts: readonly StatPart[], unit = ""): string {
  return parts
    .map((part, index) =>
      index === 0
        ? `${part.label} ${part.value}${unit}`
        : `${part.label} ${formatModifier(part.value)}${unit}`,
    )
    .join(" ");
}

/** Valeurs calculées en un coup d'œil ; chaque tuile mène à la section qui la règle. */
function SummaryTiles({ draft }: { draft: CharacterTabProps["draft"] }) {
  const hitPoints = computeMaxHitPoints(draft);
  const armorClass = computeArmorClass(draft);
  const initiative = computeInitiative(draft);
  const speed = computeSpeed(draft);
  const race = draft.raceSelection ? findRaceDefinition(draft.raceSelection.raceId) : undefined;

  const tiles = [
    {
      label: "PV max",
      value: String(hitPoints.total),
      detail:
        hitPoints.hitDie === undefined
          ? "Saisis à la main"
          : `${draft.level}d${hitPoints.hitDie} ${hitPoints.method === "rolled" ? "lancés" : "fixes"} + Con`,
      href: "#general-hit-points",
    },
    {
      label: "Classe d’armure",
      value: String(armorClass.total),
      detail: formatArmorClassBreakdown(armorClass),
      href: "#general-defense",
    },
    {
      label: "Initiative",
      value: formatModifier(initiative.total),
      detail: initiative.breakdown
        .map((part) => `${part.label} ${formatModifier(part.value)}`)
        .join(" "),
      href: "#general-rules",
    },
    {
      label: "Vitesse",
      value: `${speed.total} m`,
      detail: race ? race.name : formatBreakdown(speed.breakdown, " m"),
      href: "#general-identity",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <a
          key={tile.label}
          href={tile.href}
          className="bg-background/60 border-primary/30 hover:border-primary/60 focus-visible:ring-ring/50 grid content-start gap-1 rounded-xl border px-4 py-3 transition-colors outline-none focus-visible:ring-3"
        >
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {tile.label}
          </span>
          <span className="font-heading text-primary text-3xl leading-tight font-semibold tabular-nums">
            {tile.value}
          </span>
          <span className="text-muted-foreground line-clamp-2 text-xs">{tile.detail}</span>
        </a>
      ))}
    </div>
  );
}

/** Résumés d'effet des dons du registre (src/domain/feat.ts ne stocke que leur mécanique). */
const FEAT_EFFECTS: Record<string, string> = {
  "lanceur-de-sorts-de-bataille": "Avantage aux JS de concentration",
};

/**
 * Dons, styles et capacités de classe appliqués aux valeurs calculées, plus le bonus d'initiative
 * hors Dextérité : réunis ici plutôt qu'éparpillés dans les sections PV, CA et attaques
 * (docs/adr/0035). Les données restent celles d'avant (`featIds`, `mediumArmorMaster`…).
 */
function RulesSection({ draft, onChange }: CharacterTabProps) {
  const initiativeId = useId();
  const initiativeHintId = useId();
  const featIds = draft.featIds ?? [];

  function toggleFeat(featId: string, checked: boolean) {
    const next = checked ? [...featIds, featId] : featIds.filter((id) => id !== featId);
    onChange({ featIds: next.length > 0 ? next : undefined });
  }

  return (
    <GeneralSection
      id="general-rules"
      title="Dons, styles et bonus"
      description={
        <>
          Leurs effets s&rsquo;appliquent aux valeurs calculées. Les autres dons se décrivent dans
          l&rsquo;onglet Capacités.
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {FEATS.map((feat) => (
          <RuleSwitchRow
            key={feat.id}
            name={feat.name}
            effect={
              feat.hitPointsPerLevel
                ? `+${feat.hitPointsPerLevel} PV max par niveau`
                : (FEAT_EFFECTS[feat.id] ?? "Reconnu par les règles")
            }
            checked={featIds.includes(feat.id)}
            onCheckedChange={(checked) => toggleFeat(feat.id, checked)}
          />
        ))}
        <RuleSwitchRow
          name="Maître des armures intermédiaires"
          effect="Dex max +3 en armure intermédiaire"
          checked={draft.mediumArmorMaster ?? false}
          onCheckedChange={(checked) => onChange({ mediumArmorMaster: checked || undefined })}
        />
        <RuleSwitchRow
          name="Ambidextre"
          effect="Deux armes à une main, même non légères"
          checked={draft.dualWielder ?? false}
          onCheckedChange={(checked) => onChange({ dualWielder: checked || undefined })}
        />
        <RuleSwitchRow
          name="Style : Combat à deux armes"
          effect="Modificateur aux dégâts de la main secondaire"
          checked={draft.twoWeaponFightingStyle ?? false}
          onCheckedChange={(checked) => onChange({ twoWeaponFightingStyle: checked || undefined })}
        />
        <RuleSwitchRow
          name="Arts martiaux (Moine)"
          effect={`Dé ${martialArtsDie(draft.level).slice(1)}, armes de moine et mains nues`}
          checked={draft.martialArts ?? false}
          onCheckedChange={(checked) => onChange({ martialArts: checked || undefined })}
        />
      </div>

      <div className="bg-background/60 flex items-center gap-3 rounded-xl border px-3.5 py-2.5">
        <Label htmlFor={initiativeId} className="grid flex-1 gap-0.5">
          <span className="text-sm font-medium">Bonus d&rsquo;initiative hors Dextérité</span>
          <span id={initiativeHintId} className="text-muted-foreground text-xs font-normal">
            Ex : don Vigilant +5
          </span>
        </Label>
        <Input
          id={initiativeId}
          aria-describedby={initiativeHintId}
          type="number"
          placeholder="0"
          className="w-20 text-center font-semibold"
          value={draft.initiativeExtraBonus ?? ""}
          onChange={(event) =>
            onChange({
              initiativeExtraBonus: event.target.value ? toNumber(event.target.value) : undefined,
            })
          }
        />
      </div>
    </GeneralSection>
  );
}

const DEFAULT_THEME = "none";

function ThemeAndNotesSection({ draft, onChange }: CharacterTabProps) {
  const notesId = useId();
  const themes = [
    {
      id: DEFAULT_THEME,
      label: "Par défaut",
      hint: "Sobre, gris neutres",
      swatches: DEFAULT_THEME_SWATCHES,
    },
    ...CHARACTER_THEMES.map((theme) => ({ ...theme, hint: undefined })),
  ];
  const current = draft.themeId ?? DEFAULT_THEME;

  return (
    <GeneralSection title="Thème et notes">
      <div role="radiogroup" aria-label="Thème visuel" className="grid gap-2 sm:grid-cols-2">
        {themes.map((theme) => {
          const checked = current === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() =>
                onChange({ themeId: theme.id === DEFAULT_THEME ? undefined : theme.id })
              }
              className={cn(
                "focus-visible:ring-ring/50 flex min-h-16 items-center gap-3.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors outline-none focus-visible:ring-3",
                checked ? "border-primary bg-primary/10" : "bg-background/60 hover:bg-muted/40",
              )}
            >
              <span className="flex gap-1" aria-hidden>
                {theme.swatches.map((color) => (
                  <span
                    key={color}
                    className="size-5.5 rounded-md border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="grid gap-0.5">
                <span className="text-sm font-semibold">{theme.label}</span>
                {theme.hint && <span className="text-muted-foreground text-xs">{theme.hint}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          placeholder="Personnalité, liens, objectifs…"
          value={draft.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value || undefined })}
          rows={4}
        />
      </div>
    </GeneralSection>
  );
}
