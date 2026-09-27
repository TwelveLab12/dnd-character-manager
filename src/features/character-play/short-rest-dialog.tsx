"use client";

import { Dices, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import type { Character } from "@/domain/character";
import {
  computeHitDice,
  hitDieHealing,
  isValidHitDieRoll,
  rollDie,
} from "@/domain/calculations/hit-dice";
import { computeMaxHitPoints } from "@/domain/calculations/max-hit-points";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatModifier } from "@/features/shared/format";
import { usePlayActions } from "./use-play-actions";

/**
 * Repos court (docs/adr/0059) : dépense des dés de vie un par un — jet lancé par l'application ou
 * résultat d'un vrai dé saisi —, avec l'aperçu des PV, puis restauration des capacités au repos
 * court. Rien n'est enregistré avant « Terminer le repos » : annuler ne dépense aucun dé.
 */
export function ShortRestDialog({
  character,
  children,
}: {
  character: Character;
  /** Déclencheur (bouton « Repos court », pastille des dés de vie). */
  children: ReactNode;
}) {
  const { takeShortRest } = usePlayActions(character.id);
  const [open, setOpen] = useState(false);
  const [rolls, setRolls] = useState<number[]>([]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setRolls([]);
    }
  }

  async function finish() {
    const hitDice = computeHitDice(character);
    const healing = hitDice
      ? rolls.reduce((sum, roll) => sum + hitDieHealing(roll, hitDice.constitution), 0)
      : 0;
    const before = character.hitPoints.current;
    await takeShortRest(rolls);
    const max = computeMaxHitPoints(character).total;
    const gained = Math.min(max, before + healing) - before;
    toast.success(
      rolls.length > 0
        ? `Repos court effectué — +${gained} PV (${rolls.length} dé${rolls.length > 1 ? "s" : ""} de vie)`
        : "Repos court effectué",
    );
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repos court</DialogTitle>
          <DialogDescription>
            Restaure les capacités qui se rechargent au repos court. Dépensez des dés de vie pour
            récupérer des PV.
          </DialogDescription>
        </DialogHeader>
        <HitDiceSpending
          character={character}
          rolls={rolls}
          onAdd={(roll) => setRolls((current) => [...current, roll])}
          onRemove={(index) => setRolls((current) => current.filter((_, i) => i !== index))}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => void finish()}>
            Terminer le repos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HitDiceSpending({
  character,
  rolls,
  onAdd,
  onRemove,
}: {
  character: Character;
  rolls: number[];
  onAdd: (roll: number) => void;
  onRemove: (index: number) => void;
}) {
  const [manual, setManual] = useState("");
  const manualId = useId();
  const hitDice = computeHitDice(character);
  if (!hitDice) {
    return null;
  }

  const { die, total, constitution } = hitDice;
  const remaining = hitDice.remaining - rolls.length;
  const max = computeMaxHitPoints(character).total;
  const current = character.hitPoints.current;
  const healing = rolls.reduce((sum, roll) => sum + hitDieHealing(roll, constitution), 0);
  const preview = Math.min(max, current + healing);
  const full = preview >= max;
  const canSpend = remaining > 0 && !full;
  const manualRoll = Number(manual);
  const manualValid = manual !== "" && isValidHitDieRoll(manualRoll, die);

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSpend && manualValid) {
      onAdd(manualRoll);
      setManual("");
    }
  }

  return (
    <section aria-label="Dés de vie" className="grid gap-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          Dés de vie{" "}
          <span className="tabular-nums">
            {remaining}/{total}
          </span>{" "}
          <span className="text-muted-foreground font-normal">
            · d{die} {formatModifier(constitution)} Con
          </span>
        </p>
        <p className="text-sm tabular-nums" aria-label="Points de vie après le repos">
          PV {current}
          {preview !== current && <span className="text-success font-semibold"> → {preview}</span>}
          <span className="text-muted-foreground">/{max}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={!canSpend}
          onClick={() => onAdd(rollDie(die))}
        >
          <Dices />
          Lancer 1d{die}
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
            max={die}
            value={manual}
            disabled={!canSpend}
            onChange={(event) => setManual(event.target.value)}
            className="h-9 w-16"
          />
          <Button type="submit" variant="outline" size="lg" disabled={!canSpend || !manualValid}>
            Ajouter
          </Button>
        </form>
      </div>

      {rolls.length > 0 && (
        <ul aria-label="Dés dépensés" className="flex flex-wrap gap-1.5">
          {rolls.map((roll, index) => (
            <li
              key={index}
              className="bg-success/10 border-success/40 inline-flex h-8 items-center gap-1 rounded-full border pr-1 pl-3 text-xs tabular-nums"
            >
              d{die} : {roll} →{" "}
              <span className="font-semibold">+{hitDieHealing(roll, constitution)} PV</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Retirer le dé ${index + 1}`}
                onClick={() => onRemove(index)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-xs">
        {remaining === 0
          ? "Plus de dé de vie : un repos long en rend la moitié du niveau."
          : full
            ? "PV au maximum."
            : `Chaque dé rend son résultat ${formatModifier(constitution)} (Con), sans dépasser les PV max.`}
      </p>
    </section>
  );
}
