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
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Switch id={switchId} checked={active} onCheckedChange={() => void toggleConcentration()} />
      <Label htmlFor={switchId} className={active ? "text-info" : "text-muted-foreground"}>
        Concentration {active ? "active" : "inactive"}
      </Label>
    </div>
  );
}
