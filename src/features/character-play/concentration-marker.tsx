"use client";

import { useId } from "react";
import type { Character } from "@/domain/character";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlayActions } from "./use-play-actions";

export function ConcentrationMarker({ character }: { character: Character }) {
  const { toggleConcentration } = usePlayActions(character.id);
  const switchId = useId();
  const active = character.concentration.active;

  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor={switchId} className={active ? "text-info" : "text-muted-foreground"}>
        Concentration
      </Label>
      <Switch id={switchId} checked={active} onCheckedChange={() => void toggleConcentration()} />
    </div>
  );
}
