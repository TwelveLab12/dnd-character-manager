"use client";

import { useId } from "react";
import type { HitPointMethod } from "@/domain/character";
import { computeMaxHitPoints, fixedHitDieValue } from "@/domain/calculations/max-hit-points";
import { formatModifier } from "@/features/shared/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeneralSection } from "./general-section";
import { SegmentedControl } from "./segmented-control";
import type { CharacterTabProps } from "./types";

function toNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

const METHODS: { value: Exclude<HitPointMethod, "manual">; label: string }[] = [
  { value: "fixed", label: "Valeur fixe" },
  { value: "rolled", label: "Dés lancés" },
];

/**
 * PV max calculés (docs/adr/0027, présentation docs/adr/0035) : valeur fixe par défaut (moitié du
 * dé de vie + 1 par niveau après le 1er), ou dés lancés — seul le résultat du dé se saisit alors,
 * dans la case du niveau ; le maximum du 1er niveau et la Constitution restent automatiques. Les
 * PV actuels et temporaires se gèrent en mode jeu uniquement.
 */
export function HitPointsSection({ draft, onChange }: CharacterTabProps) {
  const manualId = useId();
  const result = computeMaxHitPoints(draft);

  if (result.method === "manual" || result.hitDie === undefined) {
    return (
      <GeneralSection id="general-hit-points" title="Points de vie max">
        <div className="grid gap-1.5 sm:max-w-xs">
          <Label htmlFor={manualId}>PV max</Label>
          <Input
            id={manualId}
            type="number"
            min={1}
            value={draft.baseMaxHitPoints ?? ""}
            onChange={(event) =>
              onChange({
                baseMaxHitPoints: event.target.value ? toNumber(event.target.value) : undefined,
              })
            }
          />
          <p className="text-muted-foreground text-xs">
            Choisis une classe gérée pour que les PV max soient calculés.
          </p>
        </div>
      </GeneralSection>
    );
  }

  const hitDie = result.hitDie;
  const rolls = draft.hitPointRolls ?? [];

  function setRoll(level: number, value: number | undefined) {
    const next = [...rolls];
    next[level - 2] = value as number;
    onChange({ hitPointRolls: next });
  }

  return (
    <GeneralSection
      id="general-hit-points"
      title="Points de vie max"
      description={`Dé de vie d${hitDie} · Constitution appliquée à chaque niveau`}
      action={
        <SegmentedControl
          label="Gain de PV à chaque niveau"
          options={METHODS}
          value={result.method}
          onValueChange={(method) => onChange({ hitPointMethod: method })}
        />
      }
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {result.levels.map((entry) => {
          const editable = entry.level > 1 && result.method === "rolled";
          return (
            <li
              key={entry.level}
              className="bg-background/60 grid justify-items-center gap-1.5 rounded-xl border px-2 py-3"
            >
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Niv. {entry.level}
              </span>
              {editable ? (
                <Input
                  type="number"
                  min={1}
                  max={hitDie}
                  aria-label={`Résultat du d${hitDie} au niveau ${entry.level}`}
                  placeholder={String(fixedHitDieValue(hitDie))}
                  className="border-primary/50 h-10 w-14 text-center text-lg font-semibold"
                  value={rolls[entry.level - 2] ?? ""}
                  onChange={(event) =>
                    setRoll(
                      entry.level,
                      event.target.value ? toNumber(event.target.value) : undefined,
                    )
                  }
                />
              ) : (
                <span className="flex h-10 items-center text-lg font-semibold tabular-nums">
                  {entry.die}
                </span>
              )}
              <span className="text-muted-foreground text-center text-xs tabular-nums">
                {formatModifier(entry.constitution)} Con
                {entry.bonus !== 0 && ` ${formatModifier(entry.bonus)} dons`} = {entry.total}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground text-xs">
        Niveau 1 : maximum du dé. PV actuels et temporaires se gèrent en mode jeu.
      </p>

      {result.warnings.length > 0 && (
        <ul className="text-warning grid gap-1 text-xs">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </GeneralSection>
  );
}
