"use client";

import { Info, XIcon } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";
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

/** Indice visuel « détails disponibles » posé sur un bloc dont le clic ouvre un `DetailSheet`. */
export function DetailsHint({ className = "" }: { className?: string }) {
  return <Info aria-hidden className={`text-muted-foreground size-4 shrink-0 ${className}`} />;
}

/**
 * Dernière valeur définie : garde le contenu du panneau pendant son animation de fermeture (le
 * parent repasse à `undefined` dès le clic), sinon il se viderait avant de glisser hors de l'écran.
 */
export function useLastDefined<T>(value: T | undefined): T | undefined {
  const [last, setLast] = useState(value);
  if (value !== undefined && value !== last) {
    setLast(value);
  }
  return value ?? last;
}

/** Glissement au-delà duquel le panneau se ferme au lâcher, en px. */
const CLOSE_DISTANCE = 120;
/** Geste rapide (px/ms) qui ferme même sous `CLOSE_DISTANCE`, à partir de `FLICK_MIN_DISTANCE`. */
const CLOSE_VELOCITY = 0.5;
const FLICK_MIN_DISTANCE = 30;

/**
 * Fermeture par glissement vers le bas (docs/adr/0044) : la zone de préhension suit le doigt, puis
 * au lâcher le panneau se ferme au-delà d'une distance ou d'une vitesse, sinon revient en place.
 * Le décalage est posé en style inline sans rendu React. L'animation de sortie (tw-animate `exit`
 * n'a qu'une image `to`) part de cette position : le panneau glisse hors de l'écran sans saut.
 */
function useSwipeToClose(onClose: () => void) {
  const drag = useRef<{
    sheet: HTMLElement;
    pointerId: number;
    startY: number;
    startTime: number;
    offset: number;
  }>(undefined);

  function setOffset(sheet: HTMLElement, offset: number, animate: boolean) {
    sheet.style.transition = animate ? "transform 200ms ease-out" : "none";
    sheet.style.transform = offset > 0 ? `translateY(${offset}px)` : "";
  }

  function end(event: ReactPointerEvent<HTMLElement>, cancelled: boolean) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }
    drag.current = undefined;
    const elapsed = Date.now() - current.startTime;
    const velocity = elapsed > 0 ? current.offset / elapsed : 0;
    const shouldClose =
      !cancelled &&
      (current.offset >= CLOSE_DISTANCE ||
        (current.offset >= FLICK_MIN_DISTANCE && velocity >= CLOSE_VELOCITY));
    if (shouldClose) {
      current.sheet.style.transition = "none";
      onClose();
    } else {
      setOffset(current.sheet, 0, true);
    }
  }

  return {
    onPointerDown(event: ReactPointerEvent<HTMLElement>) {
      // Le bouton ✕ (et tout lien) garde son clic.
      const sheet = event.currentTarget.closest<HTMLElement>('[data-slot="sheet-content"]');
      if (!sheet || event.button !== 0 || (event.target as HTMLElement).closest("button, a")) {
        return;
      }
      drag.current = {
        sheet,
        pointerId: event.pointerId,
        startY: event.clientY,
        startTime: Date.now(),
        offset: 0,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) {
        return;
      }
      current.offset = Math.max(0, event.clientY - current.startY);
      setOffset(current.sheet, current.offset, false);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => end(event, false),
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => end(event, true),
  };
}

/**
 * Coque des panneaux de détail (docs/adr/0041) : monte du bas, se ferme au clic en dehors, par ✕
 * ou Échap (Radix Dialog), centrée et limitée en largeur sur grand écran. Rendue dans un portail,
 * hors de `CharacterThemeScope` : le thème du personnage est reposé sur le contenu lui-même.
 * `footer` accueille l'action propre au bloc ; sans lui, lecture seule. La barre de préhension et
 * l'en-tête se glissent vers le bas pour fermer (docs/adr/0044).
 */
export function DetailSheet({
  open,
  onOpenChange,
  themeId,
  eyebrow,
  title,
  tags,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  tags?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const swipeHandlers = useSwipeToClose(() => onOpenChange(false));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        data-theme={isKnownThemeId(themeId) ? themeId : undefined}
        className="bg-card text-card-foreground border-primary/35 mx-auto max-h-[88dvh] w-full max-w-2xl gap-0 rounded-t-3xl border-x border-t ring-0 sm:max-h-[80dvh]"
      >
        {/* Zone de préhension : barre + en-tête. `touch-none` empêche le navigateur de faire défiler
            la page (ou de la recharger) pendant le geste. */}
        <div
          className="cursor-grab touch-none select-none active:cursor-grabbing"
          {...swipeHandlers}
        >
          <div aria-hidden className="flex justify-center pt-2.5 pb-1">
            <span className="bg-muted-foreground/45 h-1 w-10 rounded-full" />
          </div>

          <div className="flex items-start gap-2 pt-2 pr-3 pb-4 pl-5 sm:pl-7">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <SheetDescription className="text-primary text-[11px] font-semibold tracking-widest uppercase">
                {eyebrow}
              </SheetDescription>
              <SheetTitle className="font-heading text-[28px] leading-8 font-semibold break-words">
                {title}
              </SheetTitle>
              {tags && <div className="flex flex-wrap gap-1.5">{tags}</div>}
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
        </div>

        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-5 pb-6 sm:px-7">
          {children}
        </div>

        {footer && (
          <SheetFooter className="bg-background/40 mt-0 gap-2.5 border-t px-5 pt-3 pb-5 sm:px-7">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Grille de valeurs clés (2 colonnes, 4 sur grand écran). */
export function DetailStats({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-background/60 px-3 py-2.5">
          <dt className="text-muted-foreground text-[10.5px] tracking-wider uppercase">
            {stat.label}
          </dt>
          <dd className="mt-0.5 text-sm">{stat.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Texte principal d'un panneau (description saisie ou importée), retours à la ligne conservés. */
export function DetailText({ children }: { children: ReactNode }) {
  return (
    <p className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-line">{children}</p>
  );
}

/** Pastilles d'utilisations restantes (pleines = disponibles). */
export function UsePips({ remaining, total }: { remaining: number; total: number }) {
  return (
    <span aria-hidden className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`size-2.5 rounded-full ${
            index < remaining ? "bg-primary" : "border-muted-foreground/50 border-[1.5px]"
          }`}
        />
      ))}
    </span>
  );
}
