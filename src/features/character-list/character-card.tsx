"use client";

import type { Character } from "@/domain/character";
import { useCharacterStore } from "@/stores/store-provider";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CharacterCard({ character }: { character: Character }) {
  const remove = useCharacterStore((state) => state.remove);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{character.name}</CardTitle>
        <CardDescription>
          {character.class}
          {character.subclass ? ` (${character.subclass})` : ""} — niveau {character.level}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground flex gap-4 text-sm">
        <span>
          PV {character.hitPoints.current}/{character.hitPoints.max}
        </span>
        <span>CA {character.armorClass}</span>
      </CardContent>
      <CardFooter className="justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost">Supprimer</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer {character.name} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible : le personnage sera définitivement supprimé de ce
                navigateur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => void remove(character.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
