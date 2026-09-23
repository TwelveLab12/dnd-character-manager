"use client";

import { useId, useState } from "react";
import type { Character } from "@/domain/character";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { usePlayActions } from "./use-play-actions";

function toPositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function HitPointsWidget({ character }: { character: Character }) {
  const { applyDamage, applyHealing, setTemporaryHitPoints } = usePlayActions(character.id);
  const [amount, setAmount] = useState("");
  const [tempAmount, setTempAmount] = useState("");
  const amountId = useId();
  const tempId = useId();

  const { current, max, temporary } = character.hitPoints;
  const ratio = max > 0 ? current / max : 0;
  const indicatorClassName =
    ratio > 0.5 ? "bg-success" : ratio > 0.25 ? "bg-warning" : "bg-destructive";

  function handleDamage() {
    const value = toPositiveInt(amount);
    if (value > 0) {
      void applyDamage(value);
      setAmount("");
    }
  }

  function handleHealing() {
    const value = toPositiveInt(amount);
    if (value > 0) {
      void applyHealing(value);
      setAmount("");
    }
  }

  function handleSetTemporary() {
    const value = toPositiveInt(tempAmount);
    if (value > 0) {
      void setTemporaryHitPoints(value);
      setTempAmount("");
    }
  }

  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Points de vie</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{current}</span>
          <span className="text-muted-foreground text-sm">/ {max}</span>
          {temporary > 0 && <Badge variant="secondary">+{temporary} temp.</Badge>}
        </div>
      </div>

      <Progress
        value={Math.max(0, Math.min(100, ratio * 100))}
        indicatorClassName={indicatorClassName}
      />

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor={amountId} className="text-muted-foreground text-xs">
            Montant
          </Label>
          <Input
            id={amountId}
            type="number"
            min={0}
            className="w-24"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={handleDamage}>
          Dégâts
        </Button>
        <Button type="button" variant="outline" onClick={handleHealing}>
          Soin
        </Button>

        <div className="grid gap-1">
          <Label htmlFor={tempId} className="text-muted-foreground text-xs">
            PV temporaires
          </Label>
          <Input
            id={tempId}
            type="number"
            min={0}
            className="w-24"
            value={tempAmount}
            onChange={(event) => setTempAmount(event.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={handleSetTemporary}>
          Définir
        </Button>
      </div>
    </section>
  );
}
