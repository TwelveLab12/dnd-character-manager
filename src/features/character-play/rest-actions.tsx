"use client";

import { Hourglass, Moon } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Character } from "@/domain/character";
import { computeHitDice, hitDiceRecoveredOnLongRest } from "@/domain/calculations/hit-dice";
import { activeManualArmorClassEffects } from "@/domain/calculations/rest";
import { exhaustionLevel } from "@/domain/calculations/exhaustion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSpellStore } from "@/stores/store-provider";
import { ShortRestDialog } from "./short-rest-dialog";
import { usePlayActions } from "./use-play-actions";

export function RestActions({ character }: { character: Character }) {
  const { takeLongRest } = usePlayActions(character.id);
  const hasHitDice = computeHitDice(character) !== undefined;
  const concentrationSpell = useSpellStore(
    (state) => state.spells.find((spell) => spell.id === character.concentration.spellId)?.name,
  );
  const [ateAndDrank, setAteAndDrank] = useState(true);
  const exhaustion = exhaustionLevel(character);

  async function handleLongRest() {
    await takeLongRest(ateAndDrank);
    setAteAndDrank(true);
    toast.success(
      hasHitDice
        ? "Repos long effectué — PV, dés de vie, emplacements de sorts et capacités restaurés"
        : "Repos long effectué — PV, emplacements de sorts et capacités restaurés",
    );
  }

  const recovered = hitDiceRecoveredOnLongRest(character.level);
  const hitDiceText = hasHitDice
    ? ` Récupère ${recovered} dé${recovered > 1 ? "s" : ""} de vie (moitié du niveau, au moins 1).`
    : "";
  // Ce que le repos long fait disparaître (docs/adr/0065), annoncé avant de confirmer.
  const endedEffects = activeManualArmorClassEffects(character).map((effect) => effect.name);
  const longRestEnds = [
    ...(character.concentration.active
      ? [
          `Le sommeil met fin à la concentration${concentrationSpell ? ` (${concentrationSpell})` : ""}.`,
        ]
      : []),
    ...(character.hitPoints.temporary > 0
      ? [`Les PV temporaires (${character.hitPoints.temporary}) disparaissent.`]
      : []),
    ...(endedEffects.length > 0 ? [`Prennent fin : ${endedEffects.join(", ")}.`] : []),
  ];

  return (
    <div className="flex gap-2">
      <ShortRestDialog character={character}>
        <Button type="button" variant="outline">
          <Hourglass />
          Repos court
        </Button>
      </ShortRestDialog>
      <RestConfirmButton
        label="Repos long"
        icon={<Moon />}
        description={`Restaure les PV au maximum, tous les emplacements de sorts et les capacités qui se rechargent au repos long.${hitDiceText}`}
        ends={longRestEnds}
        extra={
          exhaustion > 0 && (
            <LongRestExhaustion
              level={exhaustion}
              ateAndDrank={ateAndDrank}
              onAteAndDrankChange={setAteAndDrank}
            />
          )
        }
        onConfirm={handleLongRest}
      />
    </div>
  );
}

function RestConfirmButton({
  label,
  icon,
  description,
  ends = [],
  extra,
  onConfirm,
}: {
  label: string;
  icon: ReactNode;
  description: string;
  /** Ce qui prend fin avec ce repos, listé à part pour ne pas surprendre le joueur. */
  ends?: string[];
  /** Choix propre au repos (ex : « A mangé et bu » pour l'épuisement). */
  extra?: ReactNode;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label} ?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {ends.length > 0 && (
          <ul
            aria-label="Prend fin avec le repos"
            className="border-warning/40 bg-warning/10 grid list-disc gap-1 rounded-lg border py-2 pr-3 pl-7 text-sm"
          >
            {ends.map((end) => (
              <li key={end}>{end}</li>
            ))}
          </ul>
        )}
        {extra}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Épuisement au repos long (docs/adr/0066) : un niveau de moins s'il a mangé et bu, case cochée
 * par défaut ; décochée, le niveau reste.
 */
function LongRestExhaustion({
  level,
  ateAndDrank,
  onAteAndDrankChange,
}: {
  level: number;
  ateAndDrank: boolean;
  onAteAndDrankChange: (value: boolean) => void;
}) {
  const checkboxId = useId();
  return (
    <section aria-label="Épuisement" className="grid gap-1.5 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={ateAndDrank}
          onCheckedChange={(value) => onAteAndDrankChange(value === true)}
        />
        <Label htmlFor={checkboxId} className="text-sm font-semibold">
          A mangé et bu
        </Label>
      </div>
      <p className="text-sm tabular-nums">
        Épuisement : {level} → {ateAndDrank ? level - 1 : level}
        {!ateAndDrank && (
          <span className="text-muted-foreground"> (sans nourriture ni eau, il ne baisse pas)</span>
        )}
      </p>
    </section>
  );
}
