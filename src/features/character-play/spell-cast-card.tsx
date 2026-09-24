"use client";

import { BookOpen, ChevronDown, Focus, Pin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Character } from "@/domain/character";
import type { CastMode } from "@/domain/calculations/spell-casting";
import { castOptions } from "@/domain/calculations/spell-casting";
import type { Spell } from "@/domain/spell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayActions } from "./use-play-actions";

export function ConcentrationTag() {
  return (
    <Badge className="bg-info/15 text-info gap-1 border-transparent">
      <Focus aria-hidden className="size-3" />
      Concentration
    </Badge>
  );
}

export function RitualTag() {
  return (
    <Badge className="bg-warning/15 text-warning gap-1 border-transparent">
      <BookOpen aria-hidden className="size-3" />
      Rituel
    </Badge>
  );
}

/** Sort toujours préparé (domaine, sous-classe) : ne compte pas dans la limite et ne peut pas être
 * remplacé — identité dorée pour le distinguer d'un coup d'œil des sorts préparés du jour. */
export function AlwaysPreparedTag() {
  return (
    <Badge className="bg-primary/15 text-primary gap-1 border-transparent">
      <Pin aria-hidden className="size-3" />
      Toujours préparé
    </Badge>
  );
}

function componentsLabel(spell: Spell): string {
  const parts = [
    spell.components.verbal ? "V" : null,
    spell.components.somatic ? "S" : null,
    spell.components.material ? "M" : null,
  ].filter(Boolean);
  const material = spell.components.materialDescription
    ? ` (${spell.components.materialDescription})`
    : "";
  return `${parts.join(", ")}${material}`;
}

/**
 * Carte d'un sort disponible en jeu (docs/adr/0034). Toucher le corps de la carte déplie la
 * description ; le bouton « Lancer » dépense le plus petit emplacement disponible et active la
 * concentration si besoin ; le chevron propose un emplacement supérieur ou le rituel. Un toast
 * « Annuler » rétablit l'état d'avant.
 */
export function SpellCastCard({
  character,
  spell,
  domain,
  alwaysPrepared = false,
}: {
  character: Character;
  spell: Spell;
  domain: string | undefined;
  alwaysPrepared?: boolean;
}) {
  const { castSpell, restoreCasting, toggleConcentration } = usePlayActions(character.id);
  const [open, setOpen] = useState(false);
  const options = castOptions(character, spell);
  const concentrating =
    character.concentration.active && character.concentration.spellId === spell.id;

  const defaultMode: CastMode | undefined =
    spell.level === 0
      ? { type: "cantrip" }
      : options.defaultSlotLevel !== undefined
        ? { type: "slot", level: options.defaultSlotLevel }
        : options.canRitual
          ? { type: "ritual" }
          : undefined;
  const castLabel =
    defaultMode === undefined
      ? "Plus d’emplacement"
      : defaultMode.type === "slot"
        ? `Lancer · niv. ${defaultMode.level}`
        : defaultMode.type === "ritual"
          ? "Rituel"
          : "Lancer";
  // Le chevron n'apparaît que s'il offre une autre option réellement utilisable.
  const selectableOptions =
    options.slots.filter((slot) => slot.available > 0).length + (options.canRitual ? 1 : 0);
  const hasMenu = selectableOptions > 1;

  function cast(mode: CastMode) {
    const replaced =
      spell.concentration &&
      character.concentration.active &&
      character.concentration.spellId !== spell.id;
    const previous = castSpell(spell, mode);
    if (!previous) {
      return;
    }
    const details = [
      mode.type === "slot"
        ? `emplacement niv. ${mode.level} dépensé`
        : mode.type === "ritual"
          ? "en rituel, sans emplacement"
          : "tour de magie",
      spell.concentration
        ? replaced
          ? "concentration : remplace le sort précédent"
          : "concentration activée"
        : null,
    ].filter(Boolean);
    const upcast = mode.type === "slot" && mode.level > spell.level ? ` (niv. ${mode.level})` : "";
    toast.success(`${spell.name}${upcast} lancé`, {
      description: details.join(" · "),
      action: { label: "Annuler", onClick: () => void restoreCasting(previous) },
    });
  }

  return (
    <article
      aria-label={spell.name}
      data-always-prepared={alwaysPrepared || undefined}
      className={`flex flex-col gap-3 rounded-xl border p-4 transition-shadow ${
        alwaysPrepared ? "bg-primary/10" : "bg-card"
      } ${
        concentrating
          ? "border-info ring-info/60 shadow-info/20 shadow-lg ring-1"
          : alwaysPrepared
            ? "border-primary/50"
            : ""
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid min-w-0 gap-1.5 text-left outline-none focus-visible:underline"
      >
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold break-words">{spell.name}</span>
          {alwaysPrepared && <AlwaysPreparedTag />}
          {spell.concentration && <ConcentrationTag />}
          {spell.ritual && <RitualTag />}
          {domain && <Badge variant="secondary">{domain}</Badge>}
        </span>
        <span className="text-muted-foreground text-xs">
          {[spell.castingTime, spell.range, spell.duration].filter(Boolean).join(" · ")}
        </span>
      </button>

      {open && (
        <div className="text-muted-foreground grid gap-2 border-t pt-3 text-sm leading-relaxed">
          <p>
            <span className="text-foreground font-medium">Composantes :</span>{" "}
            {componentsLabel(spell)}
          </p>
          <p className="whitespace-pre-line">{spell.description}</p>
          {spell.higherLevel && (
            <p className="whitespace-pre-line">
              <span className="text-foreground font-medium">Aux niveaux supérieurs :</span>{" "}
              {spell.higherLevel}
            </p>
          )}
        </div>
      )}

      {/* Pied de carte : état de concentration à gauche, lancement à droite — le nom garde toute
          la largeur, quelle que soit la longueur du libellé du bouton. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        {concentrating ? (
          <span className="text-info flex items-center gap-1 text-xs font-semibold">
            <Focus aria-hidden className="size-3.5" />
            En concentration
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-info h-7"
              onClick={() => void toggleConcentration()}
            >
              Rompre
            </Button>
          </span>
        ) : (
          <span />
        )}

        <div className="ml-auto flex">
          <Button
            type="button"
            disabled={defaultMode === undefined}
            variant={defaultMode === undefined ? "outline" : "default"}
            className={`${hasMenu ? "rounded-r-none" : ""} ${
              defaultMode?.type === "ritual" ? "bg-warning hover:bg-warning/90 text-background" : ""
            }`}
            onClick={() => defaultMode && cast(defaultMode)}
          >
            {castLabel}
          </Button>
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="border-background/30 rounded-l-none border-l"
                  aria-label={`Autres options de lancement : ${spell.name}`}
                >
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Lancer avec…</DropdownMenuLabel>
                {options.slots.map((slot) => (
                  <DropdownMenuItem
                    key={slot.level}
                    disabled={slot.available === 0}
                    onSelect={() => cast({ type: "slot", level: slot.level })}
                    className="justify-between"
                  >
                    <span>
                      Emplacement niv. {slot.level}
                      {slot.level > spell.level ? " (supérieur)" : ""}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {slot.available}/{slot.total}
                    </span>
                  </DropdownMenuItem>
                ))}
                {options.canRitual && (
                  <DropdownMenuItem
                    onSelect={() => cast({ type: "ritual" })}
                    className="justify-between"
                  >
                    <span>En rituel</span>
                    <span className="text-muted-foreground text-xs">+10 min, sans emplacement</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </article>
  );
}
