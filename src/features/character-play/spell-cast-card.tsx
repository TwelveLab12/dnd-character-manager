"use client";

import { ChevronDown, Focus } from "lucide-react";
import { toast } from "sonner";
import type { Character } from "@/domain/character";
import type { CastMode } from "@/domain/calculations/spell-casting";
import { castOptions } from "@/domain/calculations/spell-casting";
import type { Spell } from "@/domain/spell";
import { DetailsHint, UsePips } from "@/features/shared/detail-sheet";
import { AlwaysPreparedTag, ConcentrationTag, RitualTag } from "@/features/shared/spell-tags";
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

/**
 * Lancement d'un sort (docs/adr/0034), partagé par la carte et le panneau de détail : le mode par
 * défaut dépense le plus petit emplacement disponible et active la concentration si besoin ; un
 * toast « Annuler » rétablit l'état d'avant.
 */
function useSpellCasting(character: Character, spell: Spell) {
  const { castSpell, restoreCasting, toggleConcentration } = usePlayActions(character.id);
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

  function cast(mode: CastMode): boolean {
    const replaced =
      spell.concentration &&
      character.concentration.active &&
      character.concentration.spellId !== spell.id;
    const previous = castSpell(spell, mode);
    if (!previous) {
      return false;
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
    return true;
  }

  return { options, defaultMode, concentrating, cast, toggleConcentration };
}

/** Bouton « Lancer » + chevron (emplacement supérieur, rituel) quand il offre un autre choix. */
function SpellCastButton({
  character,
  spell,
  size = "default",
  onCast,
}: {
  character: Character;
  spell: Spell;
  size?: "default" | "lg";
  onCast?: () => void;
}) {
  const { options, defaultMode, cast } = useSpellCasting(character, spell);
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

  function run(mode: CastMode) {
    if (cast(mode)) {
      onCast?.();
    }
  }

  return (
    <div className="relative z-10 ml-auto flex">
      <Button
        type="button"
        size={size}
        disabled={defaultMode === undefined}
        variant={defaultMode === undefined ? "outline" : "default"}
        className={`${size === "lg" ? "h-11 px-4 text-[15px]" : ""} ${hasMenu ? "rounded-r-none" : ""} ${
          defaultMode?.type === "ritual" ? "bg-warning hover:bg-warning/90 text-background" : ""
        }`}
        onClick={() => defaultMode && run(defaultMode)}
      >
        {castLabel}
      </Button>
      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size={size === "lg" ? "icon-lg" : "icon"}
              className={`border-background/30 rounded-l-none border-l ${size === "lg" ? "h-11 w-10" : ""}`}
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
                onSelect={() => run({ type: "slot", level: slot.level })}
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
                onSelect={() => run({ type: "ritual" })}
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
  );
}

function ConcentratingStatus({ onBreak }: { onBreak: () => void }) {
  return (
    <span className="text-info relative z-10 flex items-center gap-1 text-xs font-semibold">
      <Focus aria-hidden className="size-3.5" />
      En concentration
      <Button type="button" variant="ghost" size="sm" className="text-info h-7" onClick={onBreak}>
        Rompre
      </Button>
    </span>
  );
}

/**
 * Carte d'un sort disponible en jeu (docs/adr/0034, 0041). Toute la carte ouvre le panneau de
 * détail (l'icône ⓘ n'en est que l'indice) ; « Lancer » et « Rompre » passent au-dessus et
 * gardent leur propre action.
 */
export function SpellCastCard({
  character,
  spell,
  domain,
  alwaysPrepared = false,
  onShowDetails,
}: {
  character: Character;
  spell: Spell;
  domain: string | undefined;
  alwaysPrepared?: boolean;
  onShowDetails: () => void;
}) {
  const { concentrating, toggleConcentration } = useSpellCasting(character, spell);

  return (
    <article
      aria-label={spell.name}
      data-always-prepared={alwaysPrepared || undefined}
      className={`relative flex flex-col gap-3 rounded-xl border p-4 transition-shadow ${
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
        aria-label={`Détails : ${spell.name}`}
        onClick={onShowDetails}
        className="hover:bg-foreground/[0.03] focus-visible:ring-ring absolute inset-0 cursor-pointer rounded-xl outline-none focus-visible:ring-2"
      />
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-1.5">
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
        </div>
        <DetailsHint className="mt-0.5" />
      </div>

      {/* Pied de carte : état de concentration à gauche, lancement à droite — le nom garde toute
          la largeur, quelle que soit la longueur du libellé du bouton. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        {concentrating ? (
          <ConcentratingStatus onBreak={() => void toggleConcentration()} />
        ) : (
          <span />
        )}
        <SpellCastButton character={character} spell={spell} />
      </div>
    </article>
  );
}

/**
 * Pied du panneau de détail en jeu : emplacements restants au niveau par défaut, avertissement
 * quand le sort remplacerait une autre concentration, et le même lancement que la carte — le
 * panneau se ferme une fois le sort lancé.
 */
export function SpellCastFooter({
  character,
  spell,
  concentrationSpellName,
  onCast,
}: {
  character: Character;
  spell: Spell;
  /** Nom du sort sur lequel le personnage est concentré, s'il y en a un. */
  concentrationSpellName: string | undefined;
  onCast: () => void;
}) {
  const { options, concentrating, toggleConcentration } = useSpellCasting(character, spell);
  const slot = options.slots.find((candidate) => candidate.level === options.defaultSlotLevel);
  const replacesConcentration =
    spell.concentration && !concentrating && concentrationSpellName !== undefined;

  return (
    <>
      {replacesConcentration && (
        <p className="text-info flex items-center gap-1.5 text-[12.5px]">
          <Focus aria-hidden className="size-3.5 shrink-0" />
          Remplacera la concentration sur {concentrationSpellName}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid flex-1 gap-1.5">
          <span className="text-muted-foreground text-xs">
            {spell.level === 0
              ? "Tour de magie · à volonté"
              : slot
                ? `Emplacements niv. ${slot.level} · ${slot.available}/${slot.total}`
                : "Aucun emplacement disponible"}
          </span>
          {slot && <UsePips remaining={slot.available} total={slot.total} />}
        </div>
        {concentrating && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="border-info/50 text-info hover:text-info h-11 px-4"
            onClick={() => void toggleConcentration()}
          >
            Rompre
          </Button>
        )}
        <SpellCastButton character={character} spell={spell} size="lg" onCast={onCast} />
      </div>
    </>
  );
}
