"use client";

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
import { usePlayActions } from "./use-play-actions";

export function RestActions({ characterId }: { characterId: string }) {
  const { takeShortRest, takeLongRest } = usePlayActions(characterId);

  async function handleShortRest() {
    await takeShortRest();
    toast.success("Repos court effectué");
  }

  async function handleLongRest() {
    await takeLongRest();
    toast.success("Repos long effectué — PV, emplacements de sorts et capacités restaurés");
  }

  return (
    <div className="flex gap-2">
      <RestConfirmButton
        label="Repos court"
        description="Restaure les capacités qui se rechargent au repos court."
        onConfirm={handleShortRest}
      />
      <RestConfirmButton
        label="Repos long"
        description="Restaure les PV au maximum, tous les emplacements de sorts et les capacités qui se rechargent au repos long."
        onConfirm={handleLongRest}
      />
    </div>
  );
}

function RestConfirmButton({
  label,
  description,
  onConfirm,
}: {
  label: string;
  description: string;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline">
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
