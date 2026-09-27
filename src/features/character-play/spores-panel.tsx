"use client";

import { Sprout } from "lucide-react";
import type { Character } from "@/domain/character";
import {
  haloOfSpores,
  isSymbioticEntityActive,
  SYMBIOTIC_ENTITY_DAMAGE_DICE,
  symbioticEntityTemporaryHitPoints,
} from "@/domain/calculations/circle-of-spores";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

/**
 * Cercle des spores sur la carte Forme sauvage (docs/adr/0069) : l'Entité symbiotique active et
 * ses effets, puis le rappel du Halo de spores (réaction), doublé pendant l'Entité.
 */
export function SporesPanel({ character }: { character: Character }) {
  const { endSymbioticEntity } = usePlayActions(character.id);
  const active = isSymbioticEntityActive(character);
  const halo = haloOfSpores(character);

  return (
    <div className="grid gap-2">
      {active && (
        <div className="border-success/40 bg-success/10 grid gap-2.5 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-success inline-flex items-center gap-1.5 text-sm font-semibold">
              <Sprout aria-hidden className="size-4" />
              Entité symbiotique
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void endSymbioticEntity()}
            >
              Mettre fin
            </Button>
          </div>
          <ul className="text-muted-foreground grid gap-1 text-[13px]">
            <li>
              PV temporaires : {character.hitPoints.temporary} (sur{" "}
              {symbioticEntityTemporaryHitPoints(character)}) — l’entité prend fin à 0
            </li>
            <li>+{SYMBIOTIC_ENTITY_DAMAGE_DICE} nécrotique aux attaques d’arme au corps à corps</li>
            <li>Halo de spores : dé lancé deux fois</li>
            <li>10 minutes, ou jusqu’à votre prochaine Forme sauvage</li>
          </ul>
        </div>
      )}
      <p className="text-muted-foreground text-[13px]">
        <span className="text-foreground font-medium">Halo de spores</span> (réaction) : une
        créature qui entre ou commence son tour à 3 m ou moins fait un jet de sauvegarde de
        Constitution{halo.saveDC !== undefined ? ` DD ${halo.saveDC}` : ""}, ou subit{" "}
        <strong className="text-foreground tabular-nums">{halo.dice}</strong> dégâts nécrotiques
        {halo.doubled ? " (doublé par l’Entité symbiotique)" : ""}.
      </p>
    </div>
  );
}
