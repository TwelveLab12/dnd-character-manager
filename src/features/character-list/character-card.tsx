"use client";

import { Focus, Heart, Pencil, Play, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { cn } from "cn";
import { computeArmorClass } from "@/domain/calculations/armor-class";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import type { Character } from "@/domain/character";
import { useCharacterStore, useSpellStore } from "@/stores/store-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CharacterThemeScope } from "@/features/character-theme/character-theme-scope";

/** Seuils de couleur des PV, les mêmes que l'anneau du mode jeu (hit-points-ring.tsx). */
function hitPointsTone(ratio: number): { text: string; fill: string; bar: string } {
  if (ratio > 0.5) {
    return { text: "text-success", fill: "fill-success", bar: "bg-success" };
  }
  if (ratio > 0.25) {
    return { text: "text-warning", fill: "fill-warning", bar: "bg-warning" };
  }
  return { text: "text-destructive", fill: "fill-destructive", bar: "bg-destructive" };
}

/**
 * Carte d'un personnage dans la liste (docs/adr/0039), aux couleurs de son thème : identité, CA
 * et PV comme le résumé du mode jeu (icône, libellé, valeur) avec une barre de PV colorée,
 * concentration en cours, puis Jouer / Modifier / Supprimer. Toute la carte mène au mode jeu via
 * le lien « Jouer », étiré sur la carte (un seul arrêt de tabulation).
 */
export function CharacterCard({ character }: { character: Character }) {
  const nameId = useId();
  const remove = useCharacterStore((state) => state.remove);
  const spells = useSpellStore((state) => state.spells);
  const armorClass = computeArmorClass(character).total;
  const max = computeMaxHitPoints(character).total;
  const { current } = character.hitPoints;
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const tone = hitPointsTone(ratio);
  const { concentration } = character;
  const concentrationSpell = concentration.spellId
    ? spells.find((spell) => spell.id === concentration.spellId)?.name
    : undefined;
  const subtitle = [
    [character.class, character.subclass].filter(Boolean).join(" — "),
    character.race,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CharacterThemeScope themeId={character.themeId}>
      <article
        aria-labelledby={nameId}
        className="group/card bg-card text-card-foreground hover:border-primary/50 relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/50 transition-colors"
      >
        <div className="flex flex-1 flex-col gap-4 p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid min-w-0 gap-1">
              <h2 id={nameId} className="font-heading text-[22px] leading-tight font-semibold">
                {character.name}
              </h2>
              {subtitle && <p className="text-muted-foreground text-[13px]">{subtitle}</p>}
            </div>
            <span className="border-primary/40 text-primary flex min-w-11 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 text-[10px] font-semibold tracking-widest uppercase">
              Niv.
              <span className="font-heading text-xl leading-none font-bold tracking-normal tabular-nums">
                {character.level}
              </span>
            </span>
          </div>

          <div className="grid gap-2.5">
            <div className="flex flex-wrap items-center gap-3.5">
              <span
                role="img"
                aria-label={`Classe d'armure ${armorClass}`}
                className="inline-flex items-center gap-1.5"
              >
                <Shield aria-hidden className="text-primary size-[18px]" />
                <span aria-hidden className="text-muted-foreground text-xs">
                  CA
                </span>
                <span aria-hidden className="font-heading text-2xl font-bold tabular-nums">
                  {armorClass}
                </span>
              </span>
              <span aria-hidden className="bg-border h-5 w-px" />
              <span className="inline-flex items-center gap-1.5">
                <Heart aria-hidden className={cn("size-[18px]", tone.text, tone.fill)} />
                <span aria-hidden className="text-muted-foreground text-xs">
                  PV
                </span>
                <span aria-hidden className="font-heading text-2xl font-bold tabular-nums">
                  {current}
                  <span className="text-muted-foreground font-sans text-xs font-medium">
                    {" "}
                    / {max}
                  </span>
                </span>
              </span>
            </div>
            <div
              role="img"
              aria-label={`Points de vie ${current} sur ${max}`}
              className="bg-border h-1.5 overflow-hidden rounded-full"
            >
              <span
                className={cn("block h-full rounded-full", tone.bar)}
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>

          {concentration.active && (
            <p className="text-info flex items-center gap-1.5 text-[13px]">
              <Focus aria-hidden className="size-4 shrink-0" />
              <span className="opacity-75">Concentration{concentrationSpell ? " :" : ""}</span>
              {concentrationSpell && <span className="truncate">{concentrationSpell}</span>}
            </p>
          )}
        </div>

        <div className="bg-background/60 flex items-center gap-2 border-t px-4 py-3">
          <Button asChild size="lg" className="h-11 flex-1">
            <Link
              href={`/characters/${character.id}`}
              aria-label={`Jouer avec ${character.name}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              <Play className="fill-current" />
              Jouer
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="relative z-10 h-11">
            <Link
              href={`/characters/${character.id}/edit`}
              aria-label={`Modifier ${character.name}`}
            >
              <Pencil />
              Modifier
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={`Supprimer ${character.name}`}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive relative z-10 size-11"
              >
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer {character.name} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible : le personnage sera définitivement supprimé de ce
                  navigateur.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="bg-destructive hover:bg-destructive/90 text-white"
                  onClick={() => void remove(character.id)}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </article>
    </CharacterThemeScope>
  );
}
