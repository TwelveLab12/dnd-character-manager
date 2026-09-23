"use client";

import type { Character } from "@/domain/character";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayActions } from "./use-play-actions";

export function ConcentrationMarker({ character }: { character: Character }) {
  const { toggleConcentration } = usePlayActions(character.id);
  const active = character.concentration.active;

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={active}
      onClick={() => void toggleConcentration()}
    >
      <Badge variant="outline" className={active ? "border-info/40 bg-info/10 text-info" : ""}>
        {active ? "Concentration active" : "Concentration inactive"}
      </Badge>
    </Button>
  );
}
