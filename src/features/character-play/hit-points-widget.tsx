"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import type { Character } from "@/domain/character";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SectionTitle } from "@/components/ui/section-title";
import { ConcentrationMarker } from "./concentration-marker";
import { RestActions } from "./rest-actions";
import { usePlayActions } from "./use-play-actions";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function HitPointsWidget({ character }: { character: Character }) {
  const { applyDamage, applyHealing, setCurrentHitPoints, setTemporaryHitPoints } = usePlayActions(
    character.id,
  );
  const currentId = useId();
  const temporaryId = useId();

  const { current, max, temporary } = character.hitPoints;
  const ratio = max > 0 ? current / max : 0;
  const indicatorClassName =
    ratio > 0.5 ? "bg-success" : ratio > 0.25 ? "bg-warning" : "bg-destructive";

  return (
    <Card>
      <CardHeader>
        <SectionTitle>Points de vie</SectionTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-start justify-between gap-6">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => void applyDamage(1)}
              aria-label="Infliger 1 dégât"
            >
              <ChevronDown />
            </Button>
            <Input
              id={currentId}
              type="number"
              min={0}
              max={max}
              value={current}
              onChange={(event) => void setCurrentHitPoints(toNumber(event.target.value))}
              aria-label="PV actuels"
              className="border-border bg-muted focus-visible:border-b-ring h-11 w-16 [appearance:textfield] rounded-t-md rounded-b-none border-0 border-b-2 px-1 text-center text-2xl font-semibold tabular-nums shadow-none focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground text-sm">/ {max}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => void applyHealing(1)}
              aria-label="Soigner 1 point de vie"
            >
              <ChevronUp />
            </Button>
          </div>

          <Progress
            value={Math.max(0, Math.min(100, ratio * 100))}
            indicatorClassName={indicatorClassName}
          />

          <div className="grid gap-1">
            <Label htmlFor={temporaryId} className="text-muted-foreground text-xs">
              PV temporaires
            </Label>
            <Input
              id={temporaryId}
              type="number"
              min={0}
              className="w-16 text-center"
              value={temporary}
              onChange={(event) => void setTemporaryHitPoints(toNumber(event.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2">
          <ConcentrationMarker character={character} />
          <RestActions characterId={character.id} />
        </div>
      </CardContent>
    </Card>
  );
}
