"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import type { Character } from "@/domain/character";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SectionTitle } from "@/components/ui/section-title";
import { MoonHitPointsGauge } from "./moon-hit-points-gauge";
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
      <CardHeader className="flex flex-row items-center justify-between">
        <SectionTitle>Points de vie</SectionTitle>
        {temporary > 0 && <Badge variant="secondary">+{temporary} temp.</Badge>}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        {character.themeId === "selune" ? (
          <MoonHitPointsGauge current={current} max={max} temporary={temporary} />
        ) : (
          <div className="grid gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{current}</span>
              <span className="text-muted-foreground text-sm">/ {max}</span>
            </div>
            <Progress
              value={Math.max(0, Math.min(100, ratio * 100))}
              indicatorClassName={indicatorClassName}
            />
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <div className="grid gap-1">
            <Label htmlFor={currentId} className="text-muted-foreground text-xs">
              PV actuels
            </Label>
            <div className="flex items-center gap-1">
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
                className="w-16 text-center"
                value={current}
                onChange={(event) => void setCurrentHitPoints(toNumber(event.target.value))}
              />
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
          </div>

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
      </CardContent>
    </Card>
  );
}
