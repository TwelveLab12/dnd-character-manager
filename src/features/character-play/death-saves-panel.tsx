"use client";

import { Check, Dices, HeartPulse, ShieldCheck, Skull, X } from "lucide-react";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import type { Character, DeathSaves } from "@/domain/character";
import {
  DEATH_SAVE_OUTCOME_LABELS,
  DEATH_SAVES_TO_RESOLVE,
  deathSaveOutcome,
  deathSavesOf,
  dyingStatus,
  rollDeathSave as resolveDeathSave,
} from "@/domain/calculations/death-saves";
import type { DyingStatus } from "@/domain/calculations/death-saves";
import { rollDie } from "@/domain/calculations/hit-dice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayActions } from "./use-play-actions";

const STATUS: Record<
  Exclude<DyingStatus, "alive">,
  { title: string; icon: typeof Skull; tone: string; caption: string }
> = {
  dying: {
    title: "Mourant",
    icon: HeartPulse,
    tone: "border-destructive/60 bg-destructive/10",
    caption:
      "À chaque tour : d20 sans modificateur. 10+ réussite, 1 = deux échecs, 20 = 1 PV. Un dégât subi = un échec (deux sur un critique : cochez-le). Tout soin remet à zéro.",
  },
  stable: {
    title: "Stabilisé",
    icon: ShieldCheck,
    tone: "border-info/60 bg-info/10",
    caption:
      "Inconscient à 0 PV, plus de jets contre la mort. Reprend 1 PV après 1d4 heures. Un dégât le rend de nouveau mourant.",
  },
  dead: {
    title: "Mort",
    icon: Skull,
    tone: "border-border bg-muted/40",
    caption:
      "Trois échecs. Un soin (Revigorer, Rappel à la vie…) le ramène à la vie ; une case cochée par erreur se décoche.",
  },
};

/**
 * Jets de sauvegarde contre la mort (docs/adr/0060), dans l'onglet Combat dès que les PV tombent
 * à 0 : réussites et échecs cochables, jet lancé par l'application ou résultat d'un vrai d20,
 * stabilisation. Trois états : mourant, stabilisé, mort.
 */
export function DeathSavesPanel({ character }: { character: Character }) {
  const status = dyingStatus(character);
  if (status === "alive") {
    return null;
  }
  const { title, icon: Icon, tone, caption } = STATUS[status];

  return (
    <section
      aria-label="Jets contre la mort"
      className={`grid gap-3 rounded-xl border p-3 sm:p-4 ${tone}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon aria-hidden className="size-5" />
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs">Jets de sauvegarde contre la mort</span>
      </header>
      <DeathSaveTracks character={character} status={status} />
      {status === "dying" && <DeathSaveActions character={character} />}
      {status === "stable" && <RegainConsciousness character={character} />}
      <p className="text-muted-foreground text-xs">{caption}</p>
    </section>
  );
}

function DeathSaveTracks({ character, status }: { character: Character; status: DyingStatus }) {
  const { setDeathSaves } = usePlayActions(character.id);
  const saves = deathSavesOf(character);
  // Stabilisé : les compteurs sont remis à zéro, trois réussites affichées pour mémoire.
  const shown: DeathSaves = status === "stable" ? { successes: 3, failures: 0 } : saves;
  const editable = status !== "stable";

  function toggle(kind: keyof DeathSaves, index: number) {
    const count = shown[kind] === index + 1 ? index : index + 1;
    void setDeathSaves({ ...saves, [kind]: count });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Track
        label="Réussites"
        count={shown.successes}
        icon={Check}
        filled="bg-success border-success text-background"
        editable={editable}
        onToggle={(index) => toggle("successes", index)}
      />
      <Track
        label="Échecs"
        count={shown.failures}
        icon={X}
        filled="bg-destructive border-destructive text-background"
        editable={editable}
        onToggle={(index) => toggle("failures", index)}
      />
    </div>
  );
}

function Track({
  label,
  count,
  icon: Icon,
  filled,
  editable,
  onToggle,
}: {
  label: string;
  count: number;
  icon: typeof Check;
  filled: string;
  editable: boolean;
  onToggle: (index: number) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <span className="w-20 text-sm font-medium">{label}</span>
      {Array.from({ length: DEATH_SAVES_TO_RESOLVE }, (_, index) => {
        const checked = index < count;
        return (
          <button
            key={index}
            type="button"
            aria-label={`${label} ${index + 1}`}
            aria-pressed={checked}
            disabled={!editable}
            onClick={() => onToggle(index)}
            className={`focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-3 disabled:cursor-default ${
              checked ? filled : "border-muted-foreground/40 hover:border-muted-foreground"
            }`}
          >
            {checked && <Icon aria-hidden className="size-5" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

function DeathSaveActions({ character }: { character: Character }) {
  const { rollDeathSave, stabilize } = usePlayActions(character.id);
  const [manual, setManual] = useState("");
  const manualId = useId();
  const manualRoll = Number(manual);
  const manualValid =
    manual !== "" && Number.isInteger(manualRoll) && manualRoll >= 1 && manualRoll <= 20;

  async function apply(roll: number) {
    const next = dyingStatus({ ...character, ...resolveDeathSave(character, roll) });
    await rollDeathSave(roll);
    const consequence = next === "stable" ? " — stabilisé" : next === "dead" ? " — mort" : "";
    toast(
      `Jet contre la mort : ${roll} — ${DEATH_SAVE_OUTCOME_LABELS[deathSaveOutcome(roll)]}${consequence}`,
    );
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (manualValid) {
      void apply(manualRoll);
      setManual("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="lg" onClick={() => void apply(rollDie(20))}>
        <Dices />
        Lancer 1d20
      </Button>
      <form onSubmit={submitManual} className="flex items-center gap-2">
        <label htmlFor={manualId} className="text-muted-foreground text-xs">
          ou résultat
        </label>
        <Input
          id={manualId}
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          className="h-9 w-16"
        />
        <Button type="submit" variant="outline" size="lg" disabled={!manualValid}>
          Valider
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="sm:ml-auto"
        onClick={() => {
          void stabilize();
          toast("Stabilisé");
        }}
      >
        <ShieldCheck />
        Stabiliser
      </Button>
    </div>
  );
}

function RegainConsciousness({ character }: { character: Character }) {
  const { setCurrentHitPoints } = usePlayActions(character.id);
  return (
    <div>
      <Button type="button" variant="outline" size="lg" onClick={() => void setCurrentHitPoints(1)}>
        <HeartPulse />
        Reprendre 1 PV
      </Button>
    </div>
  );
}
