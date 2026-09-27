"use client";

import { Hourglass, Moon } from "lucide-react";
import type { ReactNode } from "react";
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
import { ShortRestDialog } from "./short-rest-dialog";
import { usePlayActions } from "./use-play-actions";

export function RestActions({ character }: { character: Character }) {
  const { takeLongRest } = usePlayActions(character.id);
  const hasHitDice = computeHitDice(character) !== undefined;

  async function handleLongRest() {
    await takeLongRest();
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
        onConfirm={handleLongRest}
      />
    </div>
  );
}

function RestConfirmButton({
  label,
  icon,
  description,
  onConfirm,
}: {
  label: string;
  icon: ReactNode;
  description: string;
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
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
