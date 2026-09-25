"use client";

import { Info, TrendingUp, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Spell } from "@/domain/spell";
import { isKnownThemeId } from "@/features/character-theme/theme-registry";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlwaysPreparedTag, ConcentrationTag, RitualTag } from "./spell-tags";

export function spellLevelLabel(spell: Spell): string {
  const level = spell.level === 0 ? "Tour de magie" : `Niveau ${spell.level}`;
  return spell.school ? `${level} · ${spell.school}` : level;
}

export function spellComponentsLabel(spell: Spell): string {
  return [
    spell.components.verbal ? "V" : null,
    spell.components.somatic ? "S" : null,
    spell.components.material ? "M" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Indice visuel « détails disponibles » posé sur un bloc dont le clic ouvre `SpellDetailSheet`. */
export function DetailsHint({ className = "" }: { className?: string }) {
  return <Info aria-hidden className={`text-muted-foreground size-4 shrink-0 ${className}`} />;
}

/**
 * Panneau de détail d'un sort (docs/adr/0041) : monte du bas, se ferme au clic en dehors, par ✕ ou
 * Échap (Radix Dialog). Centré et limité en largeur sur grand écran. Rendu dans un portail, hors
 * de `CharacterThemeScope` : le thème du personnage est donc reposé sur le contenu lui-même.
 * `footer` accueille l'action propre à l'écran (le lancement en mode jeu) ; sans lui, lecture
 * seule.
 */
export function SpellDetailSheet({
  spell,
  onOpenChange,
  themeId,
  isAlwaysPrepared,
  showOrigin = false,
  footer,
}: {
  spell: Spell | undefined;
  onOpenChange: (open: boolean) => void;
  themeId?: string;
  /** Fonctions du sort affiché plutôt que valeurs : elles restent justes pendant l'animation de
   * fermeture, quand le parent a déjà remis `spell` à `undefined`. */
  isAlwaysPrepared?: (spell: Spell) => boolean;
  /** Classes et source du sort — utiles hors du mode jeu, où l'on choisit ses sorts. */
  showOrigin?: boolean;
  footer?: (spell: Spell) => ReactNode;
}) {
  // Garde le dernier sort affiché pendant l'animation de fermeture (le parent passe `undefined`
  // dès le clic), sinon le panneau se viderait avant de glisser hors de l'écran.
  const [lastSpell, setLastSpell] = useState(spell);
  if (spell && spell !== lastSpell) {
    setLastSpell(spell);
  }
  const shown = spell ?? lastSpell;

  const alwaysPrepared = shown !== undefined && (isAlwaysPrepared?.(shown) ?? false);
  const origin = shown
    ? [
        shown.classes.length > 0 ? `Classes : ${shown.classes.join(", ")}` : null,
        shown.source ? `Source : ${shown.source}` : null,
      ].filter(Boolean)
    : [];

  return (
    <Sheet open={spell !== undefined} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        data-theme={isKnownThemeId(themeId) ? themeId : undefined}
        className="bg-card text-card-foreground border-primary/35 mx-auto max-h-[88dvh] w-full max-w-2xl gap-0 rounded-t-3xl border-x border-t ring-0 sm:max-h-[80dvh]"
      >
        {shown && (
          <>
            <div aria-hidden className="flex justify-center pt-2.5">
              <span className="bg-muted-foreground/45 h-1 w-10 rounded-full" />
            </div>

            <div className="flex items-start gap-2 pt-3 pr-3 pb-4 pl-5 sm:pl-7">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <SheetDescription className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                  {spellLevelLabel(shown)}
                </SheetDescription>
                <SheetTitle className="font-heading text-[28px] leading-8 font-semibold break-words">
                  {shown.name}
                </SheetTitle>
                {(alwaysPrepared || shown.concentration || shown.ritual) && (
                  <div className="flex flex-wrap gap-1.5">
                    {alwaysPrepared && <AlwaysPreparedTag />}
                    {shown.concentration && <ConcentrationTag />}
                    {shown.ritual && <RitualTag />}
                  </div>
                )}
              </div>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="bg-muted-foreground/12 size-11 shrink-0 rounded-full"
                >
                  <XIcon />
                  <span className="sr-only">Fermer</span>
                </Button>
              </SheetClose>
            </div>

            <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-5 pb-6 sm:px-7">
              <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4">
                <SpellStat label="Incantation" value={shown.castingTime} />
                <SpellStat label="Portée" value={shown.range} />
                <SpellStat label="Durée" value={shown.duration} />
                <SpellStat label="Composantes" value={spellComponentsLabel(shown)} />
              </dl>
              {shown.components.materialDescription && (
                <p className="text-muted-foreground -mt-1.5 text-[13px] italic">
                  Matériel : {shown.components.materialDescription}
                </p>
              )}

              <p className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-line">
                {shown.description || "Pas de description."}
              </p>

              {shown.higherLevel && (
                <div className="border-primary/30 bg-primary/8 grid gap-1 rounded-2xl border px-3.5 py-3">
                  <p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                    <TrendingUp aria-hidden className="size-3.5" />
                    Aux niveaux supérieurs
                  </p>
                  <p className="text-foreground/88 text-sm leading-relaxed whitespace-pre-line">
                    {shown.higherLevel}
                  </p>
                </div>
              )}

              {showOrigin && origin.length > 0 && (
                <p className="text-muted-foreground text-xs">{origin.join(" · ")}</p>
              )}
            </div>

            {footer && (
              <SheetFooter className="bg-background/40 mt-0 gap-2.5 border-t px-5 pt-3 pb-5 sm:px-7">
                {footer(shown)}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SpellStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/60 px-3 py-2.5">
      <dt className="text-muted-foreground text-[10.5px] tracking-wider uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || "—"}</dd>
    </div>
  );
}
